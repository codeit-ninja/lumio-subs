import type { ResultAsync as RA } from 'neverthrow';
import { errAsync, okAsync } from 'neverthrow';
import { z } from 'zod';

import { SUBDL_API_KEY } from '$app/env/private';

import type { AppError } from '../result';
import { ERROR_CODE, fromHttp, fromHttpBytes, httpError, requireConfig } from '../result';
import { guessFormat } from '../subtitle-format';
import type { ProviderHit, SubtitleProvider, SubtitleQuery } from './types';

const BASE = 'https://api.subdl.com';

const subtitleRowSchema = z
	.object({
		nId: z.union([z.string(), z.number()]).optional(),
		id: z.union([z.string(), z.number()]).optional(),
		language: z.string().optional(),
		lang: z.string().optional(),
		release_name: z.string().optional(),
		name: z.string().optional(),
		url: z.string().optional(),
		download_link: z.string().optional(),
		download_url: z.string().optional(),
		hi: z.boolean().optional(),
		hearing_impaired: z.boolean().optional(),
		season: z.number().optional(),
		episode: z.number().optional()
	})
	.passthrough();

const searchResponseSchema = z
	.object({
		status: z.boolean().optional(),
		subtitles: z.array(subtitleRowSchema).optional(),
		results: z.array(z.unknown()).optional()
	})
	.passthrough();

function authHeaders(apiKey: string): HeadersInit {
	return {
		Authorization: `Bearer ${apiKey}`,
		'X-API-Key': apiKey,
		Accept: 'application/json'
	};
}

function rowId(row: z.infer<typeof subtitleRowSchema>): string | null {
	const raw = row.nId ?? row.id;
	return raw != null ? String(raw) : null;
}

function rowLanguage(row: z.infer<typeof subtitleRowSchema>, fallback: string): string {
	const raw = row.language ?? row.lang ?? fallback;
	return raw.toLowerCase().slice(0, 8);
}

export class SubdlProvider implements SubtitleProvider {
	id = 'subdl';
	name = 'SubDL';
	supports = { movies: true, tv: true };

	isConfigured(): boolean {
		return Boolean(SUBDL_API_KEY?.trim());
	}

	search(q: SubtitleQuery): RA<ProviderHit[], AppError> {
		if (!this.isConfigured()) {
			return okAsync([]);
		}

		return requireConfig(SUBDL_API_KEY.trim(), 'SUBDL_API_KEY').andThen((apiKey) => {
			const params = new URLSearchParams();
			params.set('unpack', '1');

			if (q.imdbId) {
				params.set('imdb_id', q.imdbId.toLowerCase());
			} else if (q.tmdbId) {
				params.set('tmdb_id', String(q.tmdbId));
			} else if (q.title?.trim()) {
				params.set('film_name', q.title.trim());
			} else {
				return okAsync([] as ProviderHit[]);
			}

			if (q.mediaType) params.set('type', q.mediaType);
			if (q.languages?.length) {
				params.set('languages', q.languages.map((l) => l.toLowerCase()).join(','));
			}
			if (q.season != null) params.set('season', String(q.season));
			if (q.episode != null) params.set('episode', String(q.episode));

			const url = `${BASE}/api/v2/subtitles/search?${params}`;
			const fallbackLang = (q.languages?.[0] ?? 'en').toLowerCase();

			return fromHttp<unknown>(url, { headers: authHeaders(apiKey) })
				.andThen((raw) => {
					const parsed = searchResponseSchema.safeParse(raw);
					if (!parsed.success) {
						return okAsync([] as ProviderHit[]);
					}

					const rows = parsed.data.subtitles ?? [];
					const hits: ProviderHit[] = [];

					for (const row of rows) {
						const externalId = rowId(row);
						const directUrl = row.download_url ?? row.download_link;
						if (!externalId && !directUrl) continue;

						const release = row.release_name ?? row.name;
						const id = externalId ?? directUrl!;

						hits.push({
							provider: this.id,
							externalId: id,
							language: rowLanguage(row, fallbackLang),
							format: guessFormat(row.name ?? release, 'srt') as ProviderHit['format'],
							release: release ?? undefined,
							fileName: row.name ?? undefined,
							rawUrl: directUrl?.startsWith('http') ? directUrl : undefined,
							download: () => this.download(apiKey, id, directUrl)
						});
					}

					return okAsync(hits.slice(0, 40));
				})
				.orElse(() => okAsync([]));
		});
	}

	downloadByExternalId(externalId: string, rawUrl?: string | null): RA<Uint8Array, AppError> {
		if (!this.isConfigured()) {
			return errAsync(httpError(ERROR_CODE.CONFIG_MISSING, 500, 'SUBDL_API_KEY missing'));
		}
		return requireConfig(SUBDL_API_KEY.trim(), 'SUBDL_API_KEY').andThen((apiKey) =>
			this.download(apiKey, externalId, rawUrl ?? undefined)
		);
	}

	private download(apiKey: string, nId: string, directUrl?: string): RA<Uint8Array, AppError> {
		if (directUrl?.startsWith('http')) {
			return fromHttpBytes(directUrl, {
				headers: { ...authHeaders(apiKey), Accept: '*/*' },
				redirect: 'follow'
			}).mapErr((e) =>
				e.kind === 'http' ? httpError(ERROR_CODE.SUBDL_API, e.status, e.message) : e
			);
		}

		const fileUrl = `${BASE}/api/v2/subtitles/${encodeURIComponent(nId)}/download?format=file`;
		return fromHttpBytes(fileUrl, {
			headers: { ...authHeaders(apiKey), Accept: '*/*' },
			redirect: 'follow'
		})
			.orElse(() =>
				fromHttpBytes(`${BASE}/api/v2/subtitles/${encodeURIComponent(nId)}/download?format=zip`, {
					headers: { ...authHeaders(apiKey), Accept: '*/*' },
					redirect: 'follow'
				})
			)
			.mapErr((e) =>
				e.kind === 'http' ? httpError(ERROR_CODE.SUBDL_API, e.status, e.message) : e
			);
	}
}
