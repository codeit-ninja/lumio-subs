<script lang="ts">
	import { JsonCode } from '#lib/components/docs/index.js';
	import { CfFrame, CodeWindow } from '#lib/components/marketing/index.js';
	import { ERROR_EXAMPLE } from '#lib/docs/api-endpoints.js';
</script>

<svelte:head>
	<title>API · SubREST</title>
	<meta name="description" content="SubREST JSON API — search and download aggregated subtitles." />
</svelte:head>

<h1>API overview</h1>
<p>
	All gated <code>/api/*</code> routes require authentication via an API key or a signed-in session. Pass
	either header below. Plan rate limits apply per user.
</p>

<CfFrame class="mb-4">
	<CodeWindow variant="embedded" showTrafficLights={false}>
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
</CfFrame>

<p>All <code>/api/*</code> errors return JSON:</p>
<JsonCode source={ERROR_EXAMPLE} title="Error" />

<nav class="mt-8 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-label="API endpoints">
	<a class="hover:text-foreground" href="/docs/api/search">Search</a>
	<a class="hover:text-foreground" href="/docs/api/subtitles">Subtitles</a>
</nav>

<style>
	.auth-panel {
		color: #a1a1aa;
	}
</style>
