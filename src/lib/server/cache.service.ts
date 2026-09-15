import { errAsync, okAsync, ResultAsync as RA } from 'neverthrow';
import type { ListResult, RecordModel } from 'pocketbase';
import { z } from 'zod';

import { CLOUDFLARE_R2_PUBLIC_BASE_URL } from '$app/env/private';

import { Service } from './base.service';
import type { ProviderHit } from './providers/types';
import type { AppError } from './result';
import { ERROR_CODE, fromPb, httpError } from './result';
import { contentHash, decodeSubtitleBytes, guessFormat, toVtt } from './subtitle-format';
import type { ResolvedMedia } from './tmdb.service';

function clip(value: string, max: number): string {
	if (value.length <= max) {
		return value;
	}

	return value.slice(0, max);
}

export type CacheLookupKey = {
	imdbId: string | null;
	tmdbId: number | null;
	season: number | null;
	episode: number | null;
	language: string;
};

export type StoredSubtitleHit = ProviderHit & {
	bytes: Uint8Array | null;
};

const searchRecordSchema = z.object({
	id: z.string().min(1),
	media: z.string().nullish(),
	imdbId: z.string().nullish(),
	tmdbId: z.number().int().positive().nullish(),
	season: z.number().int().nullish(),
	episode: z.number().int().nullish(),
	language: z.string().min(1),
	lastFetchedAt: z.string().min(1)
});

export type SubtitleSearchRecord = {
	id: string;
	mediaId: string | null;
	imdbId: string | null;
	tmdbId: number | null;
	season: number | null;
	episode: number | null;
	language: string;
	lastFetchedAt: string;
};

function parseSearch(raw: unknown): SubtitleSearchRecord | null {
	const result = searchRecordSchema.safeParse(raw);
	if (!result.success) {
		return null;
	}

	return {
		id: result.data.id,
		mediaId: result.data.media ?? null,
		imdbId: result.data.imdbId ?? null,
		tmdbId: result.data.tmdbId ?? null,
		season: result.data.season ?? null,
		episode: result.data.episode ?? null,
		language: result.data.language,
		lastFetchedAt: result.data.lastFetchedAt
	};
}

export class CacheService extends Service {
	findByKey(key: CacheLookupKey): RA<RecordModel[], AppError> {
		return fromPb<RecordModel[]>(
			this.pocketbase.collection('subtitles').getFullList({
				filter: this.keyFilter(key),
				sort: '-fetchedAt'
			})
		);
	}

	/** Remove metadata-only rows so a later successful download can be stored. */
	deleteEmptyByKey(key: CacheLookupKey): RA<void, AppError> {
		return this.findByKey(key).andThen((rows) => {
			const empty = rows.filter((row) => {
				const file = row.file;
				return !(typeof file === 'string' ? file.length > 0 : Boolean(file));
			});
			if (empty.length === 0) {
				return okAsync(undefined);
			}

			return RA.combine(
				empty.map((row) => fromPb(this.pocketbase.collection('subtitles').delete(row.id)))
			).map(() => undefined);
		});
	}

	findSearchByKey(key: CacheLookupKey): RA<SubtitleSearchRecord | null, AppError> {
		return fromPb<ListResult<RecordModel>>(
			this.pocketbase.collection('subtitle_searches').getList(1, 1, {
				filter: this.searchKeyFilter(key)
			})
		).map((result) => {
			const row = result.items[0];
			return row ? parseSearch(row) : null;
		});
	}

	getOrCreateSearch(
		key: CacheLookupKey,
		mediaId: string | null
	): RA<SubtitleSearchRecord, AppError> {
		return this.findSearchByKey(key).andThen((existing) => {
			if (existing) {
				return okAsync(existing);
			}

			const payload: Record<string, unknown> = {
				language: clip(key.language, 8),
				lastFetchedAt: new Date(0).toISOString()
			};
			if (mediaId) {
				payload.media = mediaId;
			}

			if (key.imdbId) {
				payload.imdbId = clip(key.imdbId, 32);
			}

			if (key.tmdbId) {
				payload.tmdbId = key.tmdbId;
			}

			if (key.season != null) {
				payload.season = key.season;
			}

			if (key.episode != null) {
				payload.episode = key.episode;
			}

			return fromPb<RecordModel>(
				this.pocketbase.collection('subtitle_searches').create(payload, {
					requestKey: this.createRequestKey()
				})
			)
				.andThen((record) => {
					const parsed = parseSearch(record);
					if (!parsed) {
						return errAsync(
							httpError(ERROR_CODE.INTERNAL, 500, 'Invalid subtitle_searches record')
						);
					}

					return okAsync(parsed);
				})
				.orElse(() =>
					this.findSearchByKey(key).andThen((row) => {
						if (!row) {
							return errAsync(
								httpError(ERROR_CODE.INTERNAL, 500, 'Failed to create subtitle_searches record')
							);
						}

						return okAsync(row);
					})
				);
		});
	}

	touchSearch(searchId: string, at: Date = new Date()): RA<SubtitleSearchRecord, AppError> {
		return fromPb<RecordModel>(
			this.pocketbase.collection('subtitle_searches').update(searchId, {
				lastFetchedAt: at.toISOString()
			})
		).andThen((record) => {
			const parsed = parseSearch(record);
			if (!parsed) {
				return errAsync(httpError(ERROR_CODE.INTERNAL, 500, 'Invalid subtitle_searches record'));
			}

			return okAsync(parsed);
		});
	}

	/**
	 * Insert only new unique hits that already have file bytes.
	 * Conflicts on the unique provider index are ignored.
	 */
	insertNewHits(
		key: CacheLookupKey,
		media: ResolvedMedia & { mediaType: 'movie' | 'tv' },
		hits: StoredSubtitleHit[]
	): RA<RecordModel[], AppError> {
		const now = new Date().toISOString();
		const withBytes = hits.filter((hit) => hit.bytes != null && hit.bytes.length > 0);
		const creates = withBytes.map((hit) => {
			const form = new FormData();
			if (key.imdbId) {
				form.set('imdbId', clip(key.imdbId, 32));
			}

			if (key.tmdbId) {
				form.set('tmdbId', String(key.tmdbId));
			}

			form.set('mediaType', media.mediaType);
			if (media.title) {
				form.set('title', clip(media.title, 500));
			}

			if (key.season != null) {
				form.set('season', String(key.season));
			}

			if (key.episode != null) {
				form.set('episode', String(key.episode));
			}

			form.set('language', clip(hit.language, 8));
			form.set('provider', clip(hit.provider, 64));
			form.set('externalId', clip(hit.externalId, 256));
			form.set('fetchedAt', now);
			if (hit.release) {
				form.set('release', clip(hit.release, 500));
			}

			if (hit.rawUrl) {
				form.set('rawUrl', clip(hit.rawUrl, 2000));
			}

			try {
				const text = decodeSubtitleBytes(hit.bytes!);
				const vtt = toVtt(text);
				const fileHint = hit.fileName ?? hit.release ?? `${hit.provider}-${hit.externalId}`;
				const storedName = clip(`${fileHint.replace(/[^\w.-]+/g, '_') || 'subtitle'}.vtt`, 180);
				const file = new File([new Blob([vtt], { type: 'text/vtt' })], storedName, {
					type: 'text/vtt'
				});
				form.set('file', file);
				form.set('hash', clip(contentHash(hit.bytes!), 128));
				form.set('format', 'vtt');
			} catch {
				return okAsync(null);
			}

			return fromPb<RecordModel>(
				this.pocketbase.collection('subtitles').create(form, {
					requestKey: this.createRequestKey()
				})
			).orElse(() => okAsync(null));
		});

		return RA.combine(creates).map((rows) => rows.filter((row): row is RecordModel => row != null));
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
		if (!fileName) {
			return null;
		}

		return this.pocketbase.files.getURL(record, fileName);
	}

	/**
	 * Direct public R2 object URL for a PocketBase file field.
	 * Key layout: `{collectionId}/{recordId}/{fileName}` (PB S3 storage).
	 * Uses the custom-domain base (bucket is bound to the domain, not in the path).
	 */
	r2FileUrl(record: RecordModel): string | null {
		const fileName = record.file as string | undefined;
		if (!fileName) {
			return null;
		}

		const publicBase = CLOUDFLARE_R2_PUBLIC_BASE_URL.trim().replace(/\/+$/, '');
		if (!publicBase) {
			return null;
		}

		const collectionId = record.collectionId;
		if (!collectionId) {
			return null;
		}

		const key = `${collectionId}/${record.id}/${encodeURIComponent(fileName)}`;
		return `${publicBase}/${key}`;
	}

	async readFileText(record: RecordModel): Promise<string | null> {
		const url = this.fileUrl(record);
		if (!url) {
			return null;
		}

		const res = await fetch(url);
		if (!res.ok) {
			return null;
		}

		return res.text();
	}

	private keyFilter(key: CacheLookupKey): string {
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
			// Parentheses required: PocketBase binds && tighter than ||.
			parts.push('(season = null || season = 0)');
		}

		if (key.episode != null) {
			parts.push('episode = {:episode}');
			params.episode = key.episode;
		} else {
			parts.push('(episode = null || episode = 0)');
		}

		return this.pocketbase.filter(parts.join(' && '), params);
	}

	private searchKeyFilter(key: CacheLookupKey): string {
		const parts: string[] = [`language = {:language}`];
		const params: Record<string, unknown> = { language: key.language };

		if (key.imdbId) {
			parts.push('imdbId = {:imdbId}');
			params.imdbId = key.imdbId;
		} else {
			parts.push('(imdbId = null || imdbId = "")');
		}

		if (key.tmdbId) {
			parts.push('tmdbId = {:tmdbId}');
			params.tmdbId = key.tmdbId;
		} else {
			parts.push('(tmdbId = null || tmdbId = 0)');
		}

		if (key.season != null) {
			parts.push('season = {:season}');
			params.season = key.season;
		} else {
			parts.push('(season = null || season = 0)');
		}

		if (key.episode != null) {
			parts.push('episode = {:episode}');
			params.episode = key.episode;
		} else {
			parts.push('(episode = null || episode = 0)');
		}

		return this.pocketbase.filter(parts.join(' && '), params);
	}
}
