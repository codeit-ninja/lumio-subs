import type { ResultAsync as RA } from 'neverthrow';
import { errAsync, okAsync } from 'neverthrow';
import { z } from 'zod';

import type { AppError } from '../result';
import { ERROR_CODE, fromHttp, fromHttpBytes, httpError } from '../result';
import { guessFormat } from '../subtitle-format';
import type { ProviderHit, SubtitleProvider, SubtitleQuery } from './types';

const BASE = 'https://www.podnapisi.net';
const UA = 'Mozilla/5.0 (compatible; SubREST/0.1)';

const hitSchema = z
	.object({
		id: z.union([z.string(), z.number()]),
		language: z.string().optional(),
		download: z.string().optional(),
		url: z.string().optional(),
		releases: z.array(z.string()).optional(),
		custom_releases: z.array(z.string()).optional(),
		flags: z.array(z.string()).optional(),
		stats: z
			.object({
				downloads: z.number().optional()
			})
			.optional()
	})
	.passthrough();

const searchResponseSchema = z
	.object({
		data: z.array(hitSchema).default([])
	})
	.passthrough();

function absoluteUrl(path: string): string {
	if (path.startsWith('http')) return path;
	return `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export class PodnapisiProvider implements SubtitleProvider {
	id = 'podnapisi';
	name = 'Podnapisi';
	supports = { movies: true, tv: true };

	search(q: SubtitleQuery): RA<ProviderHit[], AppError> {
		const keywords = q.title?.trim() || q.imdbId?.trim();
		if (!keywords) {
			return okAsync([]);
		}

		const lang = (q.languages?.[0] ?? 'en').toLowerCase();
		const params = new URLSearchParams();
		params.set('keywords', keywords);
		params.set('language', lang);
		if (q.year != null) params.set('year', String(q.year));

		if (q.mediaType === 'tv' || q.season != null || q.episode != null) {
			params.append('movie_type', 'tv-series');
			params.append('movie_type', 'mini-series');
			if (q.season != null) params.set('seasons', String(q.season));
			if (q.episode != null) params.set('episodes', String(q.episode));
		} else {
			params.set('movie_type', 'movie');
		}

		const url = `${BASE}/subtitles/search/advanced?${params}`;

		return fromHttp<unknown>(url, {
			headers: {
				Accept: 'application/json',
				'User-Agent': UA
			}
		})
			.andThen((raw) => {
				const parsed = searchResponseSchema.safeParse(raw);
				if (!parsed.success) {
					return okAsync([] as ProviderHit[]);
				}

				const hits: ProviderHit[] = [];
				for (const row of parsed.data.data) {
					const id = String(row.id);
					const downloadPath =
						row.download ??
						(row.url ? `${row.url.replace(/\/$/, '')}/download` : `/subtitles/${id}/download`);
					const downloadUrl = absoluteUrl(
						downloadPath.includes('container=')
							? downloadPath
							: `${downloadPath}${downloadPath.includes('?') ? '&' : '?'}container=zip`
					);
					const releases = [...(row.releases ?? []), ...(row.custom_releases ?? [])];
					const release = releases[0];

					hits.push({
						provider: this.id,
						externalId: id,
						language: (row.language ?? lang).toLowerCase(),
						format: guessFormat(release, 'srt') as ProviderHit['format'],
						release,
						rawUrl: downloadUrl,
						download: () => this.fetchFile(downloadUrl, absoluteUrl(row.url ?? `/subtitles/${id}`))
					});
				}

				return okAsync(hits.slice(0, 40));
			})
			.orElse(() => okAsync([]));
	}

	downloadByExternalId(externalId: string, rawUrl?: string | null): RA<Uint8Array, AppError> {
		const downloadUrl =
			rawUrl?.trim() || absoluteUrl(`/subtitles/${externalId}/download?container=zip`);
		if (!downloadUrl) {
			return errAsync(httpError(ERROR_CODE.PODNAPISI_API, 400, 'Missing Podnapisi download URL'));
		}
		return this.fetchFile(downloadUrl, absoluteUrl(`/subtitles/${externalId}`));
	}

	private fetchFile(downloadUrl: string, referer: string): RA<Uint8Array, AppError> {
		return fromHttpBytes(downloadUrl, {
			headers: {
				'User-Agent': UA,
				Accept: '*/*',
				Referer: referer
			},
			redirect: 'follow'
		}).mapErr((e) =>
			e.kind === 'http' ? httpError(ERROR_CODE.PODNAPISI_API, e.status, e.message) : e
		);
	}
}
