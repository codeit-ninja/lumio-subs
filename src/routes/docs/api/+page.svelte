<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	import type { ParamField } from '#lib/components/docs/index.js';
	import {
		ApiKeyBar,
		createDocsPlayground,
		DocsPlaygroundStore,
		JsonCode,
		readStoredApiKey,
		TryIt
	} from '#lib/components/docs/index.js';
	import { CodeWindow } from '#lib/components/marketing/index.js';
	import { browser } from '$app/environment';

	const store = new DocsPlaygroundStore('');

	createDocsPlayground({
		get apiKey() {
			return store.apiKey;
		},
		setApiKey: store.setApiKey,
		clearApiKey: store.clearApiKey,
		get maskedApiKey() {
			return store.maskedApiKey;
		},
		get authHeaders() {
			return store.authHeaders;
		}
	});

	onMount(() => {
		if (!browser) return;
		const stored = readStoredApiKey();
		if (stored) store.setApiKey(stored);
	});

	const searchFields: ParamField[] = [
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

	const subtitleFields: ParamField[] = [
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

	const SEARCH_EXAMPLE = `{
  "results": [
    {
      "id": "…",
      "language": "en",
      "format": "vtt",
      "release": "…",
      "fileName": "…",
      "downloadUrl": "https://…r2.cloudflarestorage.com/bucket/…/….vtt"
    }
  ]
}`;

	const ERROR_EXAMPLE = `{
  "error": { "code": "SEARCH_INVALID", "message": "…" }
}`;

	function buildSearchUrl(values: Record<string, string>): string {
		const params = new SvelteURLSearchParams();
		for (const key of ['imdb', 'tmdb', 's', 'e', 'lang', 'type'] as const) {
			const v = values[key]?.trim();
			if (v) params.set(key, v);
		}
		const qs = params.toString();
		return qs ? `/api/search?${qs}` : '/api/search';
	}

	function buildSubtitleUrl(values: Record<string, string>): string {
		const id = values.id?.trim() ?? '';
		const format = values.format?.trim() || 'vtt';
		const params = new SvelteURLSearchParams();
		params.set('format', format);
		return `/api/subtitles/${encodeURIComponent(id || '_')}?${params}`;
	}
</script>

<svelte:head>
	<title>API · SubREST</title>
	<meta name="description" content="SubREST JSON API — search and download aggregated subtitles." />
</svelte:head>

<div class="mb-6">
	<ApiKeyBar />
</div>

<h1>API overview</h1>
<p>
	All gated <code>/api/*</code> routes require authentication via an API key or a signed-in session. Pass
	either header below. Plan rate limits apply per user.
</p>

<CodeWindow variant="embedded" class="mb-4" showTrafficLights={false}>
	{#snippet title()}request.headers{/snippet}
	{#snippet titleTrailing()}HTTP{/snippet}
	<div class="auth-panel overflow-x-auto px-4 py-3 font-mono text-[0.75rem] leading-relaxed">
		<p>
			<span class="json-key">Authorization</span><span class="json-punct">:</span>
			<span class="json-boolean">Bearer</span>
			<span class="json-string">&lt;apiKey&gt;</span>
		</p>
		<p class="mt-1">
			<span class="json-key">X-API-Key</span><span class="json-punct">:</span>
			<span class="json-string">&lt;apiKey&gt;</span>
		</p>
	</div>
</CodeWindow>

<p>All <code>/api/*</code> errors return JSON:</p>
<JsonCode source={ERROR_EXAMPLE} title="Error" />

<nav class="mb-8 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-label="On this page">
	<a class="hover:text-foreground" href="#search">Search</a>
	<a class="hover:text-foreground" href="#subtitles">Subtitles</a>
</nav>

<section id="search" class="mt-10 scroll-mt-36">
	<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start">
		<div class="min-w-0">
			<h2><code>GET /api/search</code></h2>
			<table>
				<thead>
					<tr>
						<th>Param</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>imdb</code></td>
						<td>IMDb id (<code>tt…</code>) — preferred</td>
					</tr>
					<tr>
						<td><code>tmdb</code></td>
						<td>TMDB numeric id</td>
					</tr>
					<tr>
						<td><code>s</code> / <code>e</code></td>
						<td>Season / episode (TV)</td>
					</tr>
					<tr>
						<td><code>lang</code></td>
						<td>ISO language (default <code>en</code>)</td>
					</tr>
					<tr>
						<td><code>type</code></td>
						<td><code>movie</code> | <code>tv</code></td>
					</tr>
				</tbody>
			</table>

			<p>Response:</p>
			<JsonCode source={SEARCH_EXAMPLE} title="Response" />

			<p>
				<code>downloadUrl</code> is a direct R2 object URL once the subtitle file is stored. Until
				then it is <code>/api/subtitles/:id</code>. Results do not expose the upstream provider.
			</p>
			<p>
				Search returns stored rows when a previous scrape is still fresh. On a miss (or when the
				media TTL has expired), all providers are scraped, new unique subtitles are appended
				permanently, and the full set for that key is returned.
			</p>
			<p>Refresh TTL (by media release date):</p>
			<ul>
				<li>Released &lt; 30 days ago: every 1 day</li>
				<li>Released &lt; 1 year ago: every 7 days</li>
				<li>Released &lt; 5 years ago: every 30 days</li>
				<li>Older / unknown release: every 90 days</li>
			</ul>
		</div>
		<TryIt
			method="GET"
			pathTemplate="/api/search"
			description="Search aggregated subtitles"
			fields={searchFields}
			defaults={{ imdb: 'tt0111161', lang: 'en', type: '' }}
			buildUrl={buildSearchUrl}
		/>
	</div>
</section>

<section id="subtitles" class="mt-12 scroll-mt-36">
	<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start">
		<div class="min-w-0">
			<h2><code>GET /api/subtitles/:id</code></h2>
			<p>
				Query: <code>format=vtt|srt</code>. Serves a stored subtitle: <strong>302</strong> to the R2
				URL for <code>format=vtt</code> (default). <code>format=srt</code> streams a converted body from
				the stored VTT. If a row is missing its file, the provider is used once as a fallback warm path.
			</p>
		</div>
		<TryIt
			method="GET"
			pathTemplate="/api/subtitles/:id"
			description="Fetch or redirect to a stored subtitle file"
			fields={subtitleFields}
			defaults={{ format: 'vtt' }}
			buildUrl={buildSubtitleUrl}
			manualRedirect={true}
		/>
	</div>
</section>

<style>
	.auth-panel {
		color: #a1a1aa;
	}
</style>
