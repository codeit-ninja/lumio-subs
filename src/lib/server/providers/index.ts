import { GestdownProvider } from './gestdown';
import { OpenSubtitlesProvider } from './opensubtitles';
import { PodnapisiProvider } from './podnapisi';
import { SubdlProvider } from './subdl';
import { Subf2mProvider } from './subf2m';
import { TvSubtitlesProvider } from './tvsubtitles';
import type { ProviderHealth, SubtitleProvider } from './types';
import { YifyProvider } from './yify';

const healthStore = new Map<string, ProviderHealth>();

export function allProviders(): SubtitleProvider[] {
	return [
		new OpenSubtitlesProvider(),
		new SubdlProvider(),
		new PodnapisiProvider(),
		new GestdownProvider(),
		new YifyProvider(),
		new Subf2mProvider(),
		new TvSubtitlesProvider()
	];
}

/** Always returns every registered provider (aggregator — no client source filter). */
export function resolveProviders(): SubtitleProvider[] {
	return allProviders();
}

export function getProvider(id: string): SubtitleProvider | null {
	return allProviders().find((p) => p.id === id) ?? null;
}

export function recordProviderHealth(
	id: string,
	ok: boolean,
	latencyMs: number | null,
	lastError: string | null
) {
	healthStore.set(id, {
		id,
		ok,
		latencyMs,
		lastError,
		lastCheckedAt: new Date().toISOString()
	});
}
