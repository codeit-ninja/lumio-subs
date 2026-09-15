import { okAsync, ResultAsync as RA } from 'neverthrow';
import type { RecordModel } from 'pocketbase';

import { CLOUDFLARE_R2_BUCKET, CLOUDFLARE_R2_ENDPOINT } from '$app/env/private';

import { Service } from './base.service';
import type { ProviderHit } from './providers/types';
import type { AppError } from './result';
import { ERROR_CODE, fromPb } from './result';
import { contentHash, decodeSubtitleBytes, guessFormat, toVtt } from './subtitle-format';
import type { ResolvedMedia } from './tmdb.service';

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

export type StoredSubtitleHit = ProviderHit & {
	bytes: Uint8Array | null;
};

export class CacheService extends Service {
	findByKey(key: CacheLookupKey): RA<RecordModel[], AppError> {
		return fromPb<RecordModel[]>(
			this.pocketbase.collection('subtitles').getFullList({
				filter: this.keyFilter(key),
				sort: '-fetchedAt'
			})
		);
	}

	replaceByKey(
		key: CacheLookupKey,
		media: ResolvedMedia & { mediaType: 'movie' | 'tv' },
		hits: StoredSubtitleHit[]
	): RA<RecordModel[], AppError> {
		const now = new Date().toISOString();
		return this.clearByKey(key).andThen(() => this.storeHits(key, media, hits, now));
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

	/**
	 * Direct public R2 object URL for a PocketBase file field.
	 * Key layout: `{collectionId}/{recordId}/{fileName}` (PB S3 storage).
	 */
	r2FileUrl(record: RecordModel): string | null {
		const fileName = record.file as string | undefined;
		if (!fileName) return null;

		const endpoint = CLOUDFLARE_R2_ENDPOINT.trim().replace(/\/+$/, '');
		const bucket = CLOUDFLARE_R2_BUCKET.trim().replace(/^\/+|\/+$/g, '');
		if (!endpoint || !bucket) return null;

		const collectionId = record.collectionId;
		if (!collectionId) return null;

		const key = `${collectionId}/${record.id}/${encodeURIComponent(fileName)}`;
		return `${endpoint}/${bucket}/${key}`;
	}

	async readFileText(record: RecordModel): Promise<string | null> {
		const url = this.fileUrl(record);
		if (!url) return null;
		const res = await fetch(url);
		if (!res.ok) return null;
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
			parts.push('season = null || season = 0');
		}

		if (key.episode != null) {
			parts.push('episode = {:episode}');
			params.episode = key.episode;
		} else {
			parts.push('episode = null || episode = 0');
		}

		return this.pocketbase.filter(parts.join(' && '), params);
	}

	private clearByKey(key: CacheLookupKey): RA<void, AppError> {
		return this.findByKey(key).andThen((rows) =>
			RA.combine(
				rows.map((row) => fromPb(this.pocketbase.collection('subtitles').delete(row.id)))
			).map(() => undefined)
		);
	}

	private storeHits(
		key: CacheLookupKey,
		media: ResolvedMedia & { mediaType: 'movie' | 'tv' },
		hits: StoredSubtitleHit[],
		now: string
	): RA<RecordModel[], AppError> {
		const creates = hits.map((hit) => {
			const form = new FormData();
			if (key.imdbId) form.set('imdbId', clip(key.imdbId, 32));
			if (key.tmdbId) form.set('tmdbId', String(key.tmdbId));
			form.set('mediaType', media.mediaType);
			if (media.title) form.set('title', clip(media.title, 500));
			if (key.season != null) form.set('season', String(key.season));
			if (key.episode != null) form.set('episode', String(key.episode));
			form.set('language', clip(hit.language, 8));
			form.set('provider', clip(hit.provider, 64));
			form.set('externalId', clip(hit.externalId, 256));
			form.set('format', clip(guessFormat(hit.fileName, hit.format), 16));
			form.set('fetchedAt', now);
			if (hit.release) form.set('release', clip(hit.release, 500));
			if (hit.fileName) form.set('fileName', clip(hit.fileName, 500));
			if (hit.rawUrl) form.set('rawUrl', clip(hit.rawUrl, 2000));

			if (hit.bytes) {
				try {
					const text = decodeSubtitleBytes(hit.bytes);
					const vtt = toVtt(text);
					const fileHint = hit.fileName ?? `${hit.provider}-${hit.externalId}`;
					const fileName = clip(`${fileHint.replace(/[^\w.-]+/g, '_') || 'subtitle'}.vtt`, 180);
					const file = new File([new Blob([vtt], { type: 'text/vtt' })], fileName, {
						type: 'text/vtt'
					});
					form.set('file', file);
					form.set('hash', clip(contentHash(hit.bytes), 128));
					form.set('format', 'vtt');
				} catch {
					/* skip broken payload; store metadata only */
				}
			}

			return fromPb<RecordModel>(
				this.pocketbase.collection('subtitles').create(form, {
					requestKey: this.createRequestKey()
				})
			).orElse(() => okAsync(null));
		});

		return RA.combine(creates).map((rows) => rows.filter((row): row is RecordModel => row != null));
	}
}
