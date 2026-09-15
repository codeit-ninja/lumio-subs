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

export function resolveProviders(sources?: string[]): SubtitleProvider[] {
	const providers = allProviders();
	if (!sources?.length || sources.includes('all')) {
		return providers;
	}

	const wanted = new Set(sources.map((s) => s.trim().toLowerCase()).filter(Boolean));
	return providers.filter((p) => wanted.has(p.id));
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

export function getProviderHealth(): ProviderHealth[] {
	return allProviders().map((p) => {
		const existing = healthStore.get(p.id);
		return (
			existing ?? {
				id: p.id,
				ok: true,
				latencyMs: null,
				lastError: null,
				lastCheckedAt: new Date(0).toISOString()
			}
		);
	});
}

export function listSources() {
	return allProviders().map((p) => ({
		id: p.id,
		name: p.name,
		supports: p.supports
	}));
}
