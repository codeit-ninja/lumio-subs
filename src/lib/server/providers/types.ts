import type { ResultAsync } from 'neverthrow';

import type { AppError } from '../result';

export type SubtitleQuery = {
	imdbId?: string;
	tmdbId?: number;
	title?: string;
	year?: number;
	season?: number;
	episode?: number;
	languages?: string[];
	/** movie | tv — helps providers that need it */
	mediaType?: 'movie' | 'tv';
};

export type SubtitleFormat = 'srt' | 'ass' | 'vtt' | 'sub' | 'unknown';

export type ProviderHit = {
	provider: string;
	externalId: string;
	language: string;
	format: SubtitleFormat;
	release?: string;
	fileName?: string;
	hearingImpaired?: boolean;
	downloadCount?: number;
	/** Direct page/download URL when needed to rehydrate later (scrapers). */
	rawUrl?: string;
	download: () => ResultAsync<Uint8Array, AppError>;
};

export type ProviderHealth = {
	id: string;
	ok: boolean;
	latencyMs: number | null;
	lastError: string | null;
	lastCheckedAt: string;
};

export interface SubtitleProvider {
	id: string;
	name: string;
	supports: { movies: boolean; tv: boolean };
	search(q: SubtitleQuery): ResultAsync<ProviderHit[], AppError>;
	/** Re-download by cached external id (and optional rawUrl) — used for lazy fetch. */
	downloadByExternalId(
		externalId: string,
		rawUrl?: string | null
	): ResultAsync<Uint8Array, AppError>;
}
