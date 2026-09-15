import { errAsync, okAsync, ResultAsync as RA } from 'neverthrow';
import type { RecordModel } from 'pocketbase';

import type { SearchQuery, SubtitleDto } from '#lib/subtitles/dto.js';

import { Service } from './base.service';
import { CacheService } from './cache.service';
import {
	getProvider,
	getProviderHealth,
	listSources,
	recordProviderHealth,
	resolveProviders
} from './providers/index';
import { OpenSubtitlesProvider } from './providers/opensubtitles';
import type { ProviderHit } from './providers/types';
import type { AppError } from './result';
import { ERROR_CODE, formatAppError, httpError, promiseWithTimeout } from './result';
import { ensureSubtitleBytes, toVtt } from './subtitle-format';
import { TmdbService } from './tmdb.service';

const PROVIDER_TIMEOUT_MS = 12_000;
/** Metadata rows to keep per search (files are fetched lazily on demand). */
const MAX_HITS = 40;

export class SubtitleService extends Service {
	private cache() {
		return new CacheService();
	}

	private tmdb() {
		return new TmdbService();
	}

	sources() {
		return listSources();
	}

	status() {
		return getProviderHealth();
	}

	search(query: SearchQuery): RA<SubtitleDto[], AppError> {
		const language = query.lang.toLowerCase();
		const sources = query.sources
			? query.sources
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			: ['all'];

		const resolveMedia = query.imdb
			? this.tmdb().resolveByImdbId(query.imdb)
			: this.tmdb().resolveByTmdbId(query.tmdb!, query.type);

		return resolveMedia.andThen((media) => {
			const key = {
				imdbId: media.imdbId ?? query.imdb?.toLowerCase() ?? null,
				tmdbId: media.tmdbId || query.tmdb || null,
				season: query.s ?? null,
				episode: query.e ?? null,
				language
			};

			const mediaType = query.type ?? (query.s != null || query.e != null ? 'tv' : media.type);

			if (!query.refresh) {
				return this.cache()
					.findFreshSearch(key)
					.andThen((search) => {
						if (!search) {
							return this.fetchAndCache(key, sources, media, mediaType, language);
						}
						return this.cache()
							.listSubtitles(search.id)
							.andThen((rows) => {
								// Empty caches (e.g. OpenSubtitles without API key) must not block other providers.
								if (rows.length === 0) {
									return this.fetchAndCache(key, sources, media, mediaType, language);
								}
								return okAsync(rows.map((r) => this.toDto(r)));
							});
					});
			}

			return this.fetchAndCache(key, sources, media, mediaType, language);
		});
	}

	getFile(
		id: string,
		format: 'vtt' | 'srt' = 'vtt'
	): RA<{ body: string; contentType: string }, AppError> {
		return this.cache()
			.getSubtitle(id)
			.andThen((record) => this.ensureFile(record))
			.andThen((record) =>
				RA.fromPromise(
					this.cache()
						.readFileText(record)
						.then((text) => {
							if (!text) {
								throw {
									kind: 'BACKEND' as const,
									code: ERROR_CODE.SUBTITLE_NOT_FOUND,
									status: 404,
									message: 'Subtitle file missing'
								} satisfies AppError;
							}
							if (format === 'vtt') {
								return { body: toVtt(text), contentType: 'text/vtt; charset=utf-8' };
							}
							const srt = text.startsWith('WEBVTT')
								? text.replace(/^WEBVTT\n\n?/, '').replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, '$1,$2')
								: text;
							return { body: srt, contentType: 'application/x-subrip; charset=utf-8' };
						}),
					(e) =>
						typeof e === 'object' && e && 'kind' in e
							? (e as AppError)
							: {
									kind: 'BACKEND' as const,
									code: ERROR_CODE.SUBTITLE_CACHE,
									status: 500,
									message: e instanceof Error ? e.message : 'Failed to read subtitle'
								}
				)
			);
	}

	private ensureFile(record: RecordModel): RA<RecordModel, AppError> {
		if (record.file) {
			return okAsync(record);
		}

		const providerId = String(record.provider);
		const externalId = String(record.externalId);
		const rawUrl = (record.rawUrl as string | null | undefined) ?? null;
		const provider = getProvider(providerId);
		if (!provider) {
			return errAsync(httpError(ERROR_CODE.PROVIDER_ERROR, 502, `Unknown provider: ${providerId}`));
		}

		return provider.downloadByExternalId(externalId, rawUrl).andThen((bytes) => {
			try {
				const normalized = ensureSubtitleBytes(bytes);
				return this.cache().attachFile(
					record.id,
					normalized,
					(record.fileName as string | null | undefined) ?? `${providerId}-${externalId}`
				);
			} catch (e) {
				return errAsync(
					httpError(
						ERROR_CODE.SCRAPE_FAILED,
						502,
						e instanceof Error ? e.message : 'Failed to extract subtitle'
					)
				);
			}
		});
	}

	private fetchAndCache(
		key: {
			imdbId: string | null;
			tmdbId: number | null;
			season: number | null;
			episode: number | null;
			language: string;
		},
		sources: string[],
		media: { title: string; releaseDate: string | null; imdbId: string | null; tmdbId: number },
		mediaType: 'movie' | 'tv',
		language: string
	): RA<SubtitleDto[], AppError> {
		const providers = resolveProviders(sources).filter((p) =>
			mediaType === 'tv' ? p.supports.tv : p.supports.movies
		);

		const year = media.releaseDate ? new Date(media.releaseDate).getUTCFullYear() : undefined;

		const providerQuery = {
			imdbId: key.imdbId ?? undefined,
			tmdbId: key.tmdbId || undefined,
			title: media.title || undefined,
			year: Number.isFinite(year) ? year : undefined,
			season: key.season ?? undefined,
			episode: key.episode ?? undefined,
			languages: [language],
			mediaType
		};

		const searches = providers.map((provider) => {
			const started = Date.now();
			const timeoutMs =
				provider.id === 'opensubtitles'
					? OpenSubtitlesProvider.SEARCH_TIMEOUT_MS
					: PROVIDER_TIMEOUT_MS;
			return RA.fromPromise(
				promiseWithTimeout(
					(async () => {
						const result = await provider.search(providerQuery);
						if (result.isOk()) {
							recordProviderHealth(provider.id, true, Date.now() - started, null);
							return result.value;
						}
						recordProviderHealth(
							provider.id,
							false,
							Date.now() - started,
							formatAppError(result.error)
						);
						return [] as ProviderHit[];
					})(),
					timeoutMs,
					`${provider.id} timed out`
				).catch((e) => {
					recordProviderHealth(
						provider.id,
						false,
						Date.now() - started,
						e instanceof Error ? e.message : 'timeout'
					);
					return [] as ProviderHit[];
				}),
				() => ({
					kind: 'http' as const,
					code: ERROR_CODE.PROVIDER_TIMEOUT,
					status: 504,
					message: `${provider.id} failed`
				})
			).orElse(() => okAsync([] as ProviderHit[]));
		});

		return RA.combine(searches)
			.map((groups) => this.dedupe(groups.flat()).slice(0, MAX_HITS))
			.andThen((hits) =>
				this.cache()
					.replaceSearch(
						key,
						providers.map((p) => p.id),
						media.releaseDate,
						hits
					)
					.map((rows) => rows.map((r) => this.toDto(r)))
			);
	}

	private dedupe(hits: ProviderHit[]): ProviderHit[] {
		const seen = new Set<string>();
		const out: ProviderHit[] = [];
		for (const hit of hits) {
			const k = `${hit.provider}:${hit.externalId}`;
			if (seen.has(k)) continue;
			seen.add(k);
			out.push(hit);
		}
		return out.sort((a, b) => (b.downloadCount ?? 0) - (a.downloadCount ?? 0));
	}

	private toDto(record: RecordModel): SubtitleDto {
		return {
			id: record.id,
			language: String(record.language),
			format: String(record.format ?? 'vtt'),
			provider: String(record.provider),
			release: (record.release as string) ?? null,
			fileName: (record.fileName as string) ?? null,
			hearingImpaired: Boolean(record.hearingImpaired),
			downloadCount: typeof record.downloadCount === 'number' ? record.downloadCount : null,
			downloadUrl: `/api/subtitles/${record.id}`
		};
	}
}
