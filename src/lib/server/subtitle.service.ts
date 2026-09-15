import { errAsync, okAsync, ResultAsync as RA } from 'neverthrow';
import type { RecordModel } from 'pocketbase';

import type { SearchQuery, SubtitleDto } from '#lib/subtitles/dto.js';

import { Service } from './base.service';
import type { CacheLookupKey, StoredSubtitleHit } from './cache.service';
import { CacheService } from './cache.service';
import type { MediaRecord } from './media.service';
import { MediaService } from './media.service';
import { getProvider, recordProviderHealth, resolveProviders } from './providers/index';
import { OpenSubtitlesProvider } from './providers/opensubtitles';
import type { ProviderHit } from './providers/types';
import type { AppError } from './result';
import { ERROR_CODE, formatAppError, httpError, promiseWithTimeout } from './result';
import { ensureSubtitleBytes, toVtt } from './subtitle-format';
import type { ResolvedMedia } from './tmdb.service';
import { TmdbService } from './tmdb.service';

const PROVIDER_TIMEOUT_MS = 12_000;
/** Parallel downloads for non-OpenSubtitles providers. */
const DOWNLOAD_CONCURRENCY = 3;
/** OpenSubtitles CAPTCHA/rate-limits hard when parallelized. */
const OPENSUBTITLES_DOWNLOAD_CONCURRENCY = 1;
const OPENSUBTITLES_DOWNLOAD_GAP_MS = 1_500;
/** Cap stored rows per search after a fair merge across providers. */
const MAX_HITS = 40;
/** Prefer having files over empty OpenSubtitles metadata. */
const MAX_HITS_PER_PROVIDER = 12;

const DAY_MS = 86_400_000;
/** When a scrape finds hits but stores no files (CAPTCHA/429), retry after this. */
const FAILED_DOWNLOAD_RETRY_MS = 15 * 60_000;

/**
 * TTL based on media release date:
 * - < 30 days: 1 day
 * - < 1 year: 7 days
 * - < 5 years: 30 days
 * - older / unknown: 90 days
 */
export function scrapeTtlMs(releaseDate: string | null | undefined): number {
	if (!releaseDate) return 90 * DAY_MS;

	const released = new Date(releaseDate).getTime();
	if (!Number.isFinite(released)) return 90 * DAY_MS;

	const ageMs = Date.now() - released;
	if (ageMs < 30 * DAY_MS) return 1 * DAY_MS;
	if (ageMs < 365 * DAY_MS) return 7 * DAY_MS;
	if (ageMs < 5 * 365 * DAY_MS) return 30 * DAY_MS;
	return 90 * DAY_MS;
}

function isStale(lastFetchedAt: string, releaseDate: string | null | undefined): boolean {
	const fetched = new Date(lastFetchedAt).getTime();
	if (!Number.isFinite(fetched) || fetched <= 0) return true;
	return Date.now() - fetched >= scrapeTtlMs(releaseDate);
}

function hasStoredFile(record: RecordModel): boolean {
	const file = record.file;
	return typeof file === 'string' ? file.length > 0 : Boolean(file);
}

function shouldRetryEmptyFiles(lastFetchedAt: string): boolean {
	const fetched = new Date(lastFetchedAt).getTime();
	if (!Number.isFinite(fetched) || fetched <= 0) return true;
	return Date.now() - fetched >= FAILED_DOWNLOAD_RETRY_MS;
}

export class SubtitleService extends Service {
	private cache() {
		return new CacheService();
	}

	private tmdb() {
		return new TmdbService();
	}

	private media() {
		return new MediaService();
	}

	search(query: SearchQuery): RA<SubtitleDto[], AppError> {
		const language = query.lang.toLowerCase();

		const resolveMedia = query.imdb
			? this.tmdb().resolveByImdbId(query.imdb)
			: this.tmdb().resolveByTmdbId(query.tmdb!, query.type);

		return resolveMedia.andThen((resolved) => {
			const key: CacheLookupKey = {
				imdbId: resolved.imdbId ?? query.imdb?.toLowerCase() ?? null,
				tmdbId: resolved.tmdbId || query.tmdb || null,
				season: query.s ?? null,
				episode: query.e ?? null,
				language
			};

			const mediaType = query.type ?? (query.s != null || query.e != null ? 'tv' : resolved.type);

			return this.media()
				.upsertFromResolved(resolved)
				.andThen((mediaRecord) =>
					this.cache()
						.findSearchByKey(key)
						.andThen((search) =>
							this.cache()
								.findByKey(key)
								.andThen((rows) => {
									const releaseDate = mediaRecord?.releaseDate ?? resolved.releaseDate ?? null;
									const rowsWithFiles = rows.filter(hasStoredFile);

									let shouldScrape = false;
									if (!search) {
										shouldScrape = true;
									} else if (key.imdbId && isStale(search.lastFetchedAt, releaseDate)) {
										shouldScrape = true;
									} else if (
										rowsWithFiles.length === 0 &&
										shouldRetryEmptyFiles(search.lastFetchedAt)
									) {
										// Prior scrape stored no files (e.g. CAPTCHA) — retry.
										shouldScrape = true;
									}

									if (!shouldScrape) {
										return okAsync(rowsWithFiles.map((r) => this.toDto(r)));
									}

									return this.fetchAndStore(key, resolved, mediaType, language, mediaRecord);
								})
						)
				);
		});
	}

	getFile(
		id: string,
		format: 'vtt' | 'srt' = 'vtt'
	): RA<
		{ kind: 'redirect'; url: string } | { kind: 'body'; body: string; contentType: string },
		AppError
	> {
		return this.cache()
			.getSubtitle(id)
			.andThen((record) => this.ensureFile(record))
			.andThen((record) => {
				if (format === 'vtt') {
					const r2Url = this.cache().r2FileUrl(record);
					if (r2Url) {
						return okAsync({ kind: 'redirect' as const, url: r2Url });
					}
				}

				return RA.fromPromise(
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
								return {
									kind: 'body' as const,
									body: toVtt(text),
									contentType: 'text/vtt; charset=utf-8'
								};
							}
							const srt = text.startsWith('WEBVTT')
								? text.replace(/^WEBVTT\n\n?/, '').replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, '$1,$2')
								: text;
							return {
								kind: 'body' as const,
								body: srt,
								contentType: 'application/x-subrip; charset=utf-8'
							};
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
				);
			});
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
					(record.release as string | null | undefined) ?? `${providerId}-${externalId}`
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

	private fetchAndStore(
		key: CacheLookupKey,
		media: ResolvedMedia,
		mediaType: 'movie' | 'tv',
		language: string,
		mediaRecord: MediaRecord | null
	): RA<SubtitleDto[], AppError> {
		const providers = resolveProviders().filter((p) =>
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
			.map((groups) => this.mergeHits(groups))
			.andThen((hits) => this.downloadHits(hits))
			.andThen((stored) => {
				const withFiles = stored.filter((hit) => hit.bytes != null && hit.bytes.length > 0);
				return this.cache()
					.getOrCreateSearch(key, mediaRecord?.id ?? null)
					.andThen((search) =>
						this.cache()
							.deleteEmptyByKey(key)
							.andThen(() => this.cache().insertNewHits(key, { ...media, mediaType }, withFiles))
							.andThen(() => this.cache().touchSearch(search.id))
							.andThen(() => this.cache().findByKey(key))
							.map((rows) => rows.filter(hasStoredFile).map((r) => this.toDto(r)))
					);
			});
	}

	private downloadHits(hits: ProviderHit[]): RA<StoredSubtitleHit[], AppError> {
		return RA.fromPromise(
			(async () => {
				const opensubtitles: ProviderHit[] = [];
				const others: ProviderHit[] = [];
				for (const hit of hits) {
					if (hit.provider === 'opensubtitles') opensubtitles.push(hit);
					else others.push(hit);
				}

				const otherResults = await this.mapWithConcurrency(others, DOWNLOAD_CONCURRENCY, (hit) =>
					this.downloadOne(hit)
				);
				const osResults = await this.mapWithConcurrency(
					opensubtitles,
					OPENSUBTITLES_DOWNLOAD_CONCURRENCY,
					async (hit) => {
						const result = await this.downloadOne(hit);
						if (OPENSUBTITLES_DOWNLOAD_GAP_MS > 0) {
							await new Promise((r) => setTimeout(r, OPENSUBTITLES_DOWNLOAD_GAP_MS));
						}
						return result;
					}
				);

				return [...otherResults, ...osResults];
			})(),
			(e) =>
				httpError(
					ERROR_CODE.SCRAPE_FAILED,
					502,
					e instanceof Error ? e.message : 'Failed to download subtitles'
				)
		);
	}

	private async downloadOne(hit: ProviderHit): Promise<StoredSubtitleHit> {
		const provider = getProvider(hit.provider);
		if (!provider) {
			return { ...hit, bytes: null };
		}
		const result = await provider.downloadByExternalId(hit.externalId, hit.rawUrl ?? null);
		if (result.isErr()) {
			return { ...hit, bytes: null };
		}
		try {
			return { ...hit, bytes: ensureSubtitleBytes(result.value) };
		} catch {
			return { ...hit, bytes: null };
		}
	}

	private mergeHits(groups: ProviderHit[][]): ProviderHit[] {
		const capped = groups.map((group) => this.dedupe(group).slice(0, MAX_HITS_PER_PROVIDER));
		const roundRobin: ProviderHit[] = [];
		let index = 0;
		let added = true;
		while (added && roundRobin.length < MAX_HITS) {
			added = false;
			for (const group of capped) {
				if (index < group.length && roundRobin.length < MAX_HITS) {
					roundRobin.push(group[index]!);
					added = true;
				}
			}
			index += 1;
		}
		return this.dedupe(roundRobin);
	}

	private async mapWithConcurrency<T, R>(
		items: T[],
		concurrency: number,
		fn: (item: T) => Promise<R>
	): Promise<R[]> {
		if (items.length === 0) return [];
		const results: R[] = new Array(items.length);
		let next = 0;

		const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
			while (next < items.length) {
				const index = next++;
				results[index] = await fn(items[index]!);
			}
		});

		await Promise.all(workers);
		return results;
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

		return out;
	}

	private toDto(record: RecordModel): SubtitleDto {
		const r2Url = record.file ? this.cache().r2FileUrl(record) : null;
		return {
			id: record.id,
			language: String(record.language),
			format: String(record.format ?? 'vtt'),
			release: (record.release as string) ?? null,
			downloadUrl: r2Url ?? `/api/subtitles/${record.id}`
		};
	}
}
