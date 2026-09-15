import { errAsync, okAsync, ResultAsync as RA } from 'neverthrow';
import { z } from 'zod';

import { OPENSUBTITLES_SCRAPER_URL } from '$app/env/private';

import type { AppError } from '../result';
import { ERROR_CODE, httpError, requireConfig } from '../result';
import { guessFormat } from '../subtitle-format';
import type { ProviderHit, SubtitleProvider, SubtitleQuery } from './types';

/** LavX can spend a long time on cold Cloudflare / Anubis solves. */
const SCRAPER_TIMEOUT_MS = 90_000;

const searchResultSchema = z.object({
	title: z.string(),
	year: z.number().nullable().optional(),
	imdb_id: z.string().nullable().optional(),
	url: z.string().nullable().optional(),
	subtitle_count: z.number().optional().default(0),
	kind: z.string().optional()
});

const searchResponseSchema = z.object({
	results: z.array(searchResultSchema).default([]),
	total: z.number().optional(),
	query: z.string().optional()
});

const subtitleInfoSchema = z.object({
	subtitle_id: z.union([z.string(), z.number()]),
	language: z.string(),
	filename: z.string().optional().default(''),
	release_name: z.string().optional().default(''),
	uploader: z.string().optional().default(''),
	download_count: z.number().optional().default(0),
	hearing_impaired: z.boolean().optional().default(false),
	forced: z.boolean().optional().default(false),
	download_url: z.string().nullable().optional()
});

const subtitleResponseSchema = z.object({
	subtitles: z.array(subtitleInfoSchema).default([]),
	total: z.number().optional(),
	movie_url: z.string().optional()
});

const downloadResponseSchema = z.object({
	filename: z.string().optional().default(''),
	content: z.string().min(1),
	size: z.number().optional(),
	encoding: z.string().optional()
});

type SearchResult = z.infer<typeof searchResultSchema>;

function scraperBase(): string {
	return OPENSUBTITLES_SCRAPER_URL.trim().replace(/\/+$/, '');
}

function normalizeImdb(id?: string | null): string | null {
	if (!id) return null;
	const trimmed = id.trim().toLowerCase();
	if (!trimmed) return null;
	return trimmed.startsWith('tt') ? trimmed : `tt${trimmed}`;
}

function selectBestResult(
	results: SearchResult[],
	imdbId: string | null,
	title: string | undefined,
	year: number | undefined
): SearchResult | null {
	if (!results.length) return null;

	if (imdbId) {
		const exact = results.find((r) => normalizeImdb(r.imdb_id) === imdbId);
		if (exact) return exact;
	}

	const queryLower = (title ?? '').toLowerCase().trim();
	let best: SearchResult | null = null;
	let bestScore = -1;

	for (const r of results) {
		let score = 0;
		const titleLower = (r.title ?? '').toLowerCase().trim();
		if (queryLower && titleLower) {
			if (titleLower === queryLower) score += 10;
			else if (titleLower.includes(queryLower) || queryLower.includes(titleLower)) score += 5;
		}
		if (year != null && r.year === year) score += 3;
		score += Math.min((r.subtitle_count ?? 0) / 100, 2);
		if (score > bestScore) {
			bestScore = score;
			best = r;
		}
	}

	return best ?? results[0] ?? null;
}

function scraperRequest<T>(
	path: string,
	body: Record<string, unknown>,
	schema: z.ZodType<T>
): RA<T, AppError> {
	const base = scraperBase();
	const url = `${base}${path}`;

	return RA.fromPromise(
		(async () => {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), SCRAPER_TIMEOUT_MS);
			try {
				const res = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
						'User-Agent': 'LumioSubs/0.1'
					},
					body: JSON.stringify(body),
					signal: controller.signal
				});

				if (res.status === 429 || res.status === 503) {
					const retryAfter = res.headers.get('Retry-After');
					const hint = retryAfter ? `, retry after ${retryAfter}s` : '';
					throw httpError(
						ERROR_CODE.OPENSUBTITLES_SCRAPER,
						res.status,
						`OpenSubtitles scraper busy${hint}`
					);
				}

				const text = await res.text();
				if (!res.ok) {
					throw httpError(
						ERROR_CODE.OPENSUBTITLES_SCRAPER,
						res.status,
						text || res.statusText || `HTTP ${res.status}`
					);
				}

				let json: unknown;
				try {
					json = JSON.parse(text) as unknown;
				} catch {
					throw httpError(
						ERROR_CODE.OPENSUBTITLES_SCRAPER,
						502,
						'OpenSubtitles scraper returned invalid JSON'
					);
				}

				const parsed = schema.safeParse(json);
				if (!parsed.success) {
					throw httpError(
						ERROR_CODE.PROVIDER_PARSE,
						502,
						'OpenSubtitles scraper response parse failed'
					);
				}
				return parsed.data;
			} finally {
				clearTimeout(timer);
			}
		})(),
		(e) => {
			if (typeof e === 'object' && e && 'kind' in e) {
				return e as AppError;
			}
			if (e instanceof Error && e.name === 'AbortError') {
				return httpError(ERROR_CODE.OPENSUBTITLES_SCRAPER, 504, 'OpenSubtitles scraper timed out');
			}
			return httpError(
				ERROR_CODE.OPENSUBTITLES_SCRAPER,
				502,
				e instanceof Error ? e.message : 'OpenSubtitles scraper failed'
			);
		}
	);
}

export class OpenSubtitlesProvider implements SubtitleProvider {
	id = 'opensubtitles';
	name = 'OpenSubtitles';
	supports = { movies: true, tv: true };

	/** Exposed so SubtitleService can use a longer fan-out timeout for this provider. */
	static readonly SEARCH_TIMEOUT_MS = SCRAPER_TIMEOUT_MS;

	isConfigured(): boolean {
		return Boolean(OPENSUBTITLES_SCRAPER_URL?.trim());
	}

	search(q: SubtitleQuery): RA<ProviderHit[], AppError> {
		if (!this.isConfigured()) {
			return okAsync([]);
		}

		const title = q.title?.trim();
		const imdbId = normalizeImdb(q.imdbId);
		if (!title && !imdbId) {
			return okAsync([]);
		}

		return requireConfig(scraperBase(), 'OPENSUBTITLES_SCRAPER_URL').andThen(() => {
			const isTv = q.mediaType === 'tv' || q.season != null || q.episode != null;
			const searchPath = isTv ? '/api/v1/search/tv' : '/api/v1/search/movies';

			return scraperRequest(
				searchPath,
				{
					query: title || imdbId || '',
					imdb_id: imdbId,
					year: q.year ?? null,
					kind: isTv ? 'episode' : 'movie'
				},
				searchResponseSchema
			).andThen((search) => {
				const best = selectBestResult(search.results, imdbId, title, q.year);
				const movieUrl = best?.url?.trim();
				if (!movieUrl) {
					return okAsync([] as ProviderHit[]);
				}

				const languages = (q.languages ?? ['en']).map((l) => l.toLowerCase());
				const subsBody: Record<string, unknown> = {
					movie_url: movieUrl,
					languages
				};
				if (q.season != null) subsBody.season = q.season;
				if (q.episode != null) subsBody.episode = q.episode;

				return scraperRequest('/api/v1/subtitles', subsBody, subtitleResponseSchema).map(
					(listed) => {
						const wanted = new Set(languages);
						const hits: ProviderHit[] = [];

						for (const sub of listed.subtitles) {
							const language = sub.language.toLowerCase();
							if (wanted.size > 0 && !wanted.has(language)) continue;

							const subtitleId = String(sub.subtitle_id);
							const downloadUrl =
								sub.download_url?.trim() ||
								`https://www.opensubtitles.org/en/subtitles/${subtitleId}`;
							const fileName = sub.filename || undefined;

							hits.push({
								provider: this.id,
								externalId: subtitleId,
								language,
								format: guessFormat(fileName, 'srt') as ProviderHit['format'],
								release: sub.release_name || undefined,
								fileName,
								hearingImpaired: sub.hearing_impaired,
								downloadCount: sub.download_count || undefined,
								rawUrl: downloadUrl,
								download: () => this.downloadByExternalId(subtitleId, downloadUrl)
							});
						}

						return hits.slice(0, 40);
					}
				);
			});
		});
	}

	downloadByExternalId(externalId: string, rawUrl?: string | null): RA<Uint8Array, AppError> {
		if (!this.isConfigured()) {
			return errAsync(
				httpError(ERROR_CODE.CONFIG_MISSING, 500, 'OPENSUBTITLES_SCRAPER_URL missing')
			);
		}

		const downloadUrl =
			rawUrl?.trim() || `https://www.opensubtitles.org/en/subtitles/${externalId}`;

		return scraperRequest(
			'/api/v1/download/subtitle',
			{
				subtitle_id: String(externalId),
				download_url: downloadUrl
			},
			downloadResponseSchema
		).andThen((dl) => {
			try {
				const binary = Buffer.from(dl.content, 'base64');
				return okAsync(new Uint8Array(binary));
			} catch (e) {
				return errAsync(
					httpError(
						ERROR_CODE.OPENSUBTITLES_SCRAPER,
						502,
						e instanceof Error ? e.message : 'Failed to decode subtitle content'
					)
				);
			}
		});
	}
}
