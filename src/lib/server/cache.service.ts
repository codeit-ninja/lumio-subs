import { okAsync, ResultAsync as RA } from 'neverthrow';
import type { ListResult, RecordModel } from 'pocketbase';

import { Service } from './base.service';
import type { ProviderHit } from './providers/types';
import type { AppError } from './result';
import { ERROR_CODE, fromPb } from './result';
import { contentHash, decodeSubtitleBytes, guessFormat, toVtt } from './subtitle-format';

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const RECENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function clip(value: string, max: number): string {
	if (value.length <= max) return value;
	return value.slice(0, max);
}

export type CacheLookupKey = {
	imdbId: string | null;
	tmdbId: number | null;
	season: number | null;
	episode: number | null;
	language: string;
};

export class CacheService extends Service {
	findFreshSearch(key: CacheLookupKey): RA<RecordModel | null, AppError> {
		const parts: string[] = [`language = {:language}`];
		const params: Record<string, unknown> = { language: key.language };

		if (key.imdbId) {
			parts.push('imdbId = {:imdbId}');
			params.imdbId = key.imdbId;
		} else if (key.tmdbId) {
			parts.push('tmdbId = {:tmdbId}');
			params.tmdbId = key.tmdbId;
		}

		if (key.season != null) {
			parts.push('season = {:season}');
			params.season = key.season;
		} else {
			parts.push('season = null || season = 0');
		}

		if (key.episode != null) {
			parts.push('episode = {:episode}');
			params.episode = key.episode;
		} else {
			parts.push('episode = null || episode = 0');
		}

		return fromPb<ListResult<RecordModel>>(
			this.pocketbase.collection('subtitle_searches').getList(1, 1, {
				filter: this.pocketbase.filter(parts.join(' && '), params),
				sort: '-lastFetchedAt'
			})
		).map((list) => {
			const row = list.items[0] ?? null;
			if (!row) return null;
			if (!this.isFresh(row)) return null;
			return row;
		});
	}

	listSubtitles(searchId: string): RA<RecordModel[], AppError> {
		return fromPb<RecordModel[]>(
			this.pocketbase.collection('subtitles').getFullList({
				filter: this.pocketbase.filter('search = {:searchId}', { searchId }),
				sort: '-downloadCount'
			})
		);
	}

	replaceSearch(
		key: CacheLookupKey,
		sources: string[],
		mediaReleaseDate: string | null,
		hits: ProviderHit[]
	): RA<RecordModel[], AppError> {
		const now = new Date().toISOString();
		const expiresAt = this.computeExpiry(mediaReleaseDate);

		return this.findAnySearch(key)
			.andThen((existing) => {
				if (existing) {
					return fromPb<RecordModel>(
						this.pocketbase.collection('subtitle_searches').update(existing.id, {
							queriedSources: sources,
							lastFetchedAt: now,
							expiresAt,
							mediaReleaseDate,
							imdbId: key.imdbId,
							tmdbId: key.tmdbId,
							season: key.season,
							episode: key.episode,
							language: key.language
						})
					).andThen((search) => this.clearSubtitles(search.id).map(() => search));
				}

				return fromPb<RecordModel>(
					this.pocketbase.collection('subtitle_searches').create(
						{
							imdbId: key.imdbId,
							tmdbId: key.tmdbId,
							season: key.season,
							episode: key.episode,
							language: key.language,
							queriedSources: sources,
							lastFetchedAt: now,
							expiresAt,
							mediaReleaseDate
						},
						{ requestKey: this.createRequestKey() }
					)
				);
			})
			.andThen((search) => this.storeHits(search.id, hits, now));
	}

	getSubtitle(id: string): RA<RecordModel, AppError> {
		return fromPb<RecordModel>(this.pocketbase.collection('subtitles').getOne(id)).mapErr((e) => {
			if (e.kind === 'BACKEND' && e.status === 404) {
				return {
					kind: 'BACKEND' as const,
					code: ERROR_CODE.SUBTITLE_NOT_FOUND,
					status: 404,
					message: `Subtitle ${id} not found`
				};
			}
			return e;
		});
	}

	attachFile(id: string, bytes: Uint8Array, fileHint?: string | null): RA<RecordModel, AppError> {
		const text = decodeSubtitleBytes(bytes);
		const vtt = toVtt(text);
		const blob = new Blob([vtt], { type: 'text/vtt' });
		const fileName = clip(`${(fileHint ?? id).replace(/[^\w.-]+/g, '_') || 'subtitle'}.vtt`, 180);
		const file = new File([blob], fileName, { type: 'text/vtt' });

		const form = new FormData();
		form.set('file', file);
		form.set('hash', clip(contentHash(bytes), 128));
		form.set('fetchedAt', new Date().toISOString());
		form.set('format', clip(guessFormat(fileHint, 'vtt'), 16));

		return fromPb<RecordModel>(this.pocketbase.collection('subtitles').update(id, form));
	}

	fileUrl(record: RecordModel): string | null {
		const fileName = record.file as string | undefined;
		if (!fileName) return null;
		return this.pocketbase.files.getURL(record, fileName);
	}

	async readFileText(record: RecordModel): Promise<string | null> {
		const url = this.fileUrl(record);
		if (!url) return null;
		const res = await fetch(url);
		if (!res.ok) return null;
		return res.text();
	}

	private findAnySearch(key: CacheLookupKey): RA<RecordModel | null, AppError> {
		const parts: string[] = [`language = {:language}`];
		const params: Record<string, unknown> = { language: key.language };
		if (key.imdbId) {
			parts.push('imdbId = {:imdbId}');
			params.imdbId = key.imdbId;
		} else if (key.tmdbId) {
			parts.push('tmdbId = {:tmdbId}');
			params.tmdbId = key.tmdbId;
		}
		if (key.season != null) {
			parts.push('season = {:season}');
			params.season = key.season;
		}
		if (key.episode != null) {
			parts.push('episode = {:episode}');
			params.episode = key.episode;
		}

		return fromPb<ListResult<RecordModel>>(
			this.pocketbase.collection('subtitle_searches').getList(1, 1, {
				filter: this.pocketbase.filter(parts.join(' && '), params),
				sort: '-lastFetchedAt'
			})
		).map((list) => list.items[0] ?? null);
	}

	private clearSubtitles(searchId: string): RA<void, AppError> {
		return fromPb<RecordModel[]>(
			this.pocketbase.collection('subtitles').getFullList({
				filter: this.pocketbase.filter('search = {:searchId}', { searchId })
			})
		).andThen((rows) =>
			RA.combine(
				rows.map((row) => fromPb(this.pocketbase.collection('subtitles').delete(row.id)))
			).map(() => undefined)
		);
	}

	private storeHits(
		searchId: string,
		hits: ProviderHit[],
		now: string
	): RA<RecordModel[], AppError> {
		const creates = hits.map((hit) => {
			const payload: Record<string, unknown> = {
				search: searchId,
				provider: clip(hit.provider, 64),
				externalId: clip(hit.externalId, 256),
				language: clip(hit.language, 8),
				format: clip(guessFormat(hit.fileName, hit.format), 16),
				hearingImpaired: Boolean(hit.hearingImpaired),
				fetchedAt: now
			};
			if (hit.release) payload.release = clip(hit.release, 500);
			if (hit.fileName) payload.fileName = clip(hit.fileName, 500);
			if (hit.downloadCount != null) payload.downloadCount = hit.downloadCount;
			if (hit.rawUrl) payload.rawUrl = clip(hit.rawUrl, 2000);

			return fromPb<RecordModel>(
				this.pocketbase.collection('subtitles').create(payload, {
					requestKey: this.createRequestKey()
				})
			).orElse(() => okAsync(null));
		});

		return RA.combine(creates).map((rows) => rows.filter((row): row is RecordModel => row != null));
	}

	private isFresh(row: RecordModel): boolean {
		const expiresAt = row.expiresAt as string | null | undefined;
		if (expiresAt) {
			return new Date(expiresAt).getTime() > Date.now();
		}
		const mediaRelease = row.mediaReleaseDate as string | null | undefined;
		if (!mediaRelease) return true;
		const age = Date.now() - new Date(mediaRelease).getTime();
		if (age > YEAR_MS) return true;
		const last = new Date(row.lastFetchedAt as string).getTime();
		return Date.now() - last < RECENT_TTL_MS;
	}

	private computeExpiry(mediaReleaseDate: string | null): string | null {
		if (!mediaReleaseDate) return null;
		const age = Date.now() - new Date(mediaReleaseDate).getTime();
		if (age > YEAR_MS) return null;
		return new Date(Date.now() + RECENT_TTL_MS).toISOString();
	}
}
