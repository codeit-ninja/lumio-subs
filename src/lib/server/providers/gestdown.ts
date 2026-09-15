import type { ResultAsync as RA } from 'neverthrow';
import { errAsync, okAsync } from 'neverthrow';
import { z } from 'zod';

import type { AppError } from '../result';
import { ERROR_CODE, fromHttp, fromHttpBytes, httpError } from '../result';
import type { ProviderHit, SubtitleProvider, SubtitleQuery } from './types';

const BASE = 'https://api.gestdown.info';

const showSchema = z.object({
	id: z.string().optional(),
	uniqueId: z.string().optional(),
	name: z.string().optional(),
	tvdbId: z.union([z.string(), z.number()]).optional()
});

const searchShowsSchema = z.object({
	shows: z.array(showSchema).optional(),
	Shows: z.array(showSchema).optional()
});

const subtitleRowSchema = z
	.object({
		subtitleId: z.string().optional(),
		SubtitleId: z.string().optional(),
		language: z.string().optional(),
		Language: z.string().optional(),
		version: z.string().optional(),
		Version: z.string().optional(),
		hearingImpaired: z.boolean().optional(),
		HearingImpaired: z.boolean().optional(),
		downloadCount: z.number().optional()
	})
	.passthrough();

const episodeSubsSchema = z
	.object({
		subtitles: z.array(subtitleRowSchema).optional(),
		Subtitles: z.array(subtitleRowSchema).optional()
	})
	.passthrough();

function showId(show: z.infer<typeof showSchema>): string | null {
	return show.uniqueId ?? show.id ?? null;
}

function subId(row: z.infer<typeof subtitleRowSchema>): string | null {
	return row.subtitleId ?? row.SubtitleId ?? null;
}

export class GestdownProvider implements SubtitleProvider {
	id = 'gestdown';
	name = 'Gestdown';
	supports = { movies: false, tv: true };

	search(q: SubtitleQuery): RA<ProviderHit[], AppError> {
		if (q.season == null || q.episode == null) {
			return okAsync([]);
		}

		const title = q.title?.trim();
		if (!title || title.length < 3) {
			return okAsync([]);
		}

		const lang = (q.languages?.[0] ?? 'en').toLowerCase();

		return fromHttp<unknown>(`${BASE}/shows/search/${encodeURIComponent(title)}`, {
			headers: { Accept: 'application/json' }
		})
			.andThen((raw) => {
				const parsed = searchShowsSchema.safeParse(raw);
				const shows = parsed.success ? (parsed.data.shows ?? parsed.data.Shows ?? []) : [];
				const id = shows.map(showId).find(Boolean);
				if (!id) {
					return okAsync([] as ProviderHit[]);
				}

				return fromHttp<unknown>(`${BASE}/subtitles/get/${id}/${q.season}/${q.episode}/${lang}`, {
					headers: { Accept: 'application/json' }
				}).map((subRaw) => {
					const subParsed = episodeSubsSchema.safeParse(subRaw);
					const rows = subParsed.success
						? (subParsed.data.subtitles ?? subParsed.data.Subtitles ?? [])
						: [];

					const hits: ProviderHit[] = [];
					for (const row of rows) {
						const externalId = subId(row);
						if (!externalId) continue;
						hits.push({
							provider: this.id,
							externalId,
							language: (row.language ?? row.Language ?? lang).toLowerCase(),
							format: 'srt',
							release: row.version ?? row.Version ?? undefined,
							hearingImpaired: row.hearingImpaired ?? row.HearingImpaired ?? false,
							downloadCount: row.downloadCount,
							rawUrl: `${BASE}/subtitles/download/${externalId}`,
							download: () =>
								fromHttpBytes(`${BASE}/subtitles/download/${externalId}`).mapErr((e) =>
									e.kind === 'http' ? httpError(ERROR_CODE.GESTOWN_API, e.status, e.message) : e
								)
						});
					}
					return hits;
				});
			})
			.orElse(() => okAsync([]));
	}

	downloadByExternalId(externalId: string, rawUrl?: string | null): RA<Uint8Array, AppError> {
		const url = rawUrl?.trim() || `${BASE}/subtitles/download/${externalId}`;
		if (!externalId.trim()) {
			return errAsync(httpError(ERROR_CODE.GESTOWN_API, 400, 'Missing Gestdown subtitle id'));
		}
		return fromHttpBytes(url).mapErr((e) =>
			e.kind === 'http' ? httpError(ERROR_CODE.GESTOWN_API, e.status, e.message) : e
		);
	}
}
