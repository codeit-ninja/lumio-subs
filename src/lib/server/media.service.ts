import type { ResultAsync as RA } from 'neverthrow';
import { errAsync, okAsync } from 'neverthrow';
import type { ListResult, RecordModel } from 'pocketbase';
import { z } from 'zod';

import { Service } from './base.service';
import type { AppError } from './result';
import { ERROR_CODE, fromPb, httpError } from './result';
import type { ResolvedMedia } from './tmdb.service';

const mediaRecordSchema = z.object({
	id: z.string().min(1),
	imdbId: z.string().min(1),
	tmdbId: z.number().int().positive().nullish(),
	mediaType: z.enum(['movie', 'tv']),
	title: z.string().nullish(),
	releaseDate: z.string().nullish()
});

export type MediaRecord = {
	id: string;
	imdbId: string;
	tmdbId: number | null;
	mediaType: 'movie' | 'tv';
	title: string | null;
	releaseDate: string | null;
};

function parseMedia(raw: unknown): MediaRecord | null {
	const result = mediaRecordSchema.safeParse(raw);
	if (!result.success) return null;
	return {
		id: result.data.id,
		imdbId: result.data.imdbId.toLowerCase(),
		tmdbId: result.data.tmdbId ?? null,
		mediaType: result.data.mediaType,
		title: result.data.title ?? null,
		releaseDate: result.data.releaseDate ?? null
	};
}

function clip(value: string, max: number): string {
	if (value.length <= max) return value;
	return value.slice(0, max);
}

export class MediaService extends Service {
	getByImdbId(imdbId: string): RA<MediaRecord | null, AppError> {
		const normalized = imdbId.toLowerCase();
		return fromPb<ListResult<RecordModel>>(
			this.pocketbase.collection('media').getList(1, 1, {
				filter: this.pocketbase.filter('imdbId = {:imdbId}', { imdbId: normalized })
			})
		).map((result) => {
			const row = result.items[0];
			return row ? parseMedia(row) : null;
		});
	}

	/**
	 * Create or update a media row after the first search that resolves an IMDb id.
	 */
	upsertFromResolved(media: ResolvedMedia): RA<MediaRecord | null, AppError> {
		const imdbId = media.imdbId?.toLowerCase() ?? null;
		if (!imdbId) {
			return okAsync(null);
		}

		const payload: Record<string, unknown> = {
			imdbId: clip(imdbId, 32),
			mediaType: media.type,
			title: media.title ? clip(media.title, 500) : ''
		};
		if (media.tmdbId > 0) payload.tmdbId = media.tmdbId;
		if (media.releaseDate) payload.releaseDate = media.releaseDate;

		return this.getByImdbId(imdbId).andThen((existing) => {
			const write = existing
				? fromPb<RecordModel>(this.pocketbase.collection('media').update(existing.id, payload))
				: fromPb<RecordModel>(
						this.pocketbase.collection('media').create(payload, {
							requestKey: this.createRequestKey()
						})
					);

			return write.andThen((record) => {
				const parsed = parseMedia(record);
				if (!parsed) {
					return errAsync(httpError(ERROR_CODE.INTERNAL, 500, 'Invalid media record'));
				}
				return okAsync(parsed);
			});
		});
	}
}
