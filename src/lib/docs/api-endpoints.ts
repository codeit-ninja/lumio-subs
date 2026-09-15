import { SvelteURLSearchParams } from 'svelte/reactivity';

import type { ParamField } from '#lib/components/docs/playground/types.js';

export const ERROR_EXAMPLE = `{
  "error": { "code": "SEARCH_INVALID", "message": "…" }
}`;

export const SEARCH_EXAMPLE = `{
  "results": [
    {
      "id": "…",
      "language": "en",
      "format": "vtt",
      "release": "…",
      "fileName": "…",
      "downloadUrl": "https://download.subrest.org/…/….vtt"
    }
  ]
}`;

export const searchFields: ParamField[] = [
	{ name: 'imdb', label: 'imdb', placeholder: 'tt0111161' },
	{ name: 'tmdb', label: 'tmdb', placeholder: '278' },
	{ name: 's', label: 's (season)', placeholder: '1' },
	{ name: 'e', label: 'e (episode)', placeholder: '1' },
	{ name: 'lang', label: 'lang', placeholder: 'en' },
	{
		name: 'type',
		label: 'type',
		kind: 'select',
		options: [
			{ value: '', label: '(optional)' },
			{ value: 'movie', label: 'movie' },
			{ value: 'tv', label: 'tv' }
		]
	}
];

export const searchDefaults: Record<string, string> = {
	imdb: 'tt0111161',
	lang: 'en',
	type: ''
};

export const subtitleFields: ParamField[] = [
	{ name: 'id', label: 'id', placeholder: 'subtitle id', required: true },
	{
		name: 'format',
		label: 'format',
		kind: 'select',
		options: [
			{ value: 'vtt', label: 'vtt' },
			{ value: 'srt', label: 'srt' }
		]
	}
];

export const subtitleDefaults: Record<string, string> = {
	format: 'vtt'
};

export function buildSearchUrl(values: Record<string, string>): string {
	const params = new SvelteURLSearchParams();
	for (const key of ['imdb', 'tmdb', 's', 'e', 'lang', 'type'] as const) {
		const v = values[key]?.trim();
		if (v) {params.set(key, v);}
	}
	const qs = params.toString();
	return qs ? `/api/search?${qs}` : '/api/search';
}

export function buildSubtitleUrl(values: Record<string, string>): string {
	const id = values.id?.trim() ?? '';
	const format = values.format?.trim() || 'vtt';
	const params = new SvelteURLSearchParams();
	params.set('format', format);
	return `/api/subtitles/${encodeURIComponent(id || '_')}?${params}`;
}
