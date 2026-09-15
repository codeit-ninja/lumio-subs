import { errAsync, okAsync, ResultAsync as RA } from 'neverthrow';
import { z } from 'zod';

import { TMDB_API_KEY } from '$app/env/private';

import { Service } from './base.service';
import type { AppError } from './result';
import { ERROR_CODE, fromHttp, httpError, requireConfig } from './result';

const tmdbMovieSchema = z.object({
	id: z.number(),
	title: z.string().optional(),
	name: z.string().optional(),
	release_date: z.string().nullable().optional(),
	first_air_date: z.string().nullable().optional(),
	external_ids: z
		.object({
			imdb_id: z.string().nullable().optional()
		})
		.optional(),
	imdb_id: z.string().nullable().optional()
});

export type ResolvedMedia = {
	tmdbId: number;
	imdbId: string | null;
	type: 'movie' | 'tv';
	title: string;
	releaseDate: string | null;
};

export class TmdbService extends Service {
	isConfigured(): boolean {
		return Boolean(TMDB_API_KEY?.trim());
	}

	resolveByTmdbId(tmdbId: number, typeHint?: 'movie' | 'tv'): RA<ResolvedMedia, AppError> {
		return this.fetchMedia(tmdbId, typeHint);
	}

	resolveByImdbId(imdbId: string): RA<ResolvedMedia, AppError> {
		const normalized = imdbId.toLowerCase();

		if (!this.isConfigured()) {
			return okAsync({
				tmdbId: 0,
				imdbId: normalized,
				type: 'movie' as const,
				title: '',
				releaseDate: null
			});
		}

		return requireConfig(TMDB_API_KEY.trim(), 'TMDB_API_KEY').andThen((key) =>
			fromHttp<{ movie_results?: { id: number }[]; tv_results?: { id: number }[] }>(
				`https://api.themoviedb.org/3/find/${normalized}?external_source=imdb_id`,
				{ headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } }
			)
				.orElse(() =>
					fromHttp<{ movie_results?: { id: number }[]; tv_results?: { id: number }[] }>(
						`https://api.themoviedb.org/3/find/${normalized}?api_key=${key}&external_source=imdb_id`
					)
				)
				.andThen((body) => {
					const movieId = body.movie_results?.[0]?.id;
					const tvId = body.tv_results?.[0]?.id;
					if (movieId) return this.fetchMedia(movieId, 'movie');
					if (tvId) return this.fetchMedia(tvId, 'tv');
					return okAsync({
						tmdbId: 0,
						imdbId: normalized,
						type: 'movie' as const,
						title: '',
						releaseDate: null
					});
				})
		);
	}

	private fetchMedia(tmdbId: number, typeHint?: 'movie' | 'tv'): RA<ResolvedMedia, AppError> {
		if (!this.isConfigured()) {
			return errAsync(
				httpError(ERROR_CODE.CONFIG_MISSING, 500, 'TMDB_API_KEY required to resolve TMDB ids')
			);
		}

		return requireConfig(TMDB_API_KEY.trim(), 'TMDB_API_KEY').andThen((key) => {
			const tryType = async (type: 'movie' | 'tv') => {
				const path =
					type === 'movie'
						? `https://api.themoviedb.org/3/movie/${tmdbId}?append_to_response=external_ids`
						: `https://api.themoviedb.org/3/tv/${tmdbId}?append_to_response=external_ids`;

				const withBearer = await fromHttp<unknown>(path, {
					headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }
				});
				if (withBearer.isOk()) return { type, raw: withBearer.value };

				const withQuery = await fromHttp<unknown>(
					`${path}${path.includes('?') ? '&' : '?'}api_key=${key}`
				);
				if (withQuery.isOk()) return { type, raw: withQuery.value };
				return null;
			};

			const order: Array<'movie' | 'tv'> = typeHint
				? [typeHint, typeHint === 'movie' ? 'tv' : 'movie']
				: ['movie', 'tv'];

			return RA.fromPromise(
				(async () => {
					for (const type of order) {
						const hit = await tryType(type);
						if (!hit) continue;
						const parsed = tmdbMovieSchema.safeParse(hit.raw);
						if (!parsed.success) continue;
						const imdb = parsed.data.imdb_id ?? parsed.data.external_ids?.imdb_id ?? null;
						const title = parsed.data.title ?? parsed.data.name ?? '';
						const releaseDate = parsed.data.release_date ?? parsed.data.first_air_date ?? null;
						return {
							tmdbId,
							imdbId: imdb ? imdb.toLowerCase() : null,
							type: hit.type,
							title,
							releaseDate
						} satisfies ResolvedMedia;
					}

					throw httpError(ERROR_CODE.TMDB_NOT_FOUND, 404, `TMDB id ${tmdbId} not found`);
				})(),
				(e) =>
					typeof e === 'object' && e && 'kind' in e
						? (e as AppError)
						: httpError(ERROR_CODE.TMDB_API, 502, e instanceof Error ? e.message : 'TMDB failed')
			);
		});
	}
}
