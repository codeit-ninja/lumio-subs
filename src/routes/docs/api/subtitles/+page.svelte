<script lang="ts">
	import { TryIt } from '#lib/components/docs/index.js';
	import { buildSubtitleUrl, subtitleDefaults, subtitleFields } from '#lib/docs/api-endpoints.js';
</script>

<svelte:head>
	<title>GET /api/subtitles/:id · API · SubREST</title>
	<meta name="description" content="Fetch or redirect to a stored subtitle file." />
</svelte:head>

<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start">
	<div class="min-w-0">
		<h1><code>GET /api/subtitles/:id</code></h1>
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
		defaults={subtitleDefaults}
		buildUrl={buildSubtitleUrl}
		manualRedirect={true}
	/>
</div>
