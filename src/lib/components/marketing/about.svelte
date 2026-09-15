<script lang="ts">
	import CfFrame from './cf-frame.svelte';
	import CodeWindow from './code-window.svelte';
</script>

<section id="about" class="about scroll-mt-20 border-y border-border">
	<div class="relative mx-auto max-w-6xl px-4 py-20 sm:py-24">
		<div
			class="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-16"
		>
			<div class="flex flex-col gap-6">
				<p class="font-mono text-xs tracking-wider text-primary uppercase">How it works</p>
				<h2 class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
					Built for developers
				</h2>
				<p class="max-w-xl text-lg leading-relaxed text-pretty text-muted">
					SubREST aggregates subtitles from multiple providers, normalizes the results, and serves
					VTT or SRT through a clean JSON API. Drop it into media apps, streaming clients, or any
					backend that needs reliable subtitle lookup — without stitching providers yourself.
				</p>

				<ul class="mt-2 flex flex-col gap-5 border-l border-border pl-5">
					<li class="flex flex-col gap-1">
						<span class="font-mono text-xs text-primary">01 · search</span>
						<span class="text-sm text-muted"
							>Query by IMDb or TMDB across every enabled provider.</span
						>
					</li>
					<li class="flex flex-col gap-1">
						<span class="font-mono text-xs text-primary">02 · pick</span>
						<span class="text-sm text-muted"
							>Normalized JSON with language, release, and download URL.</span
						>
					</li>
					<li class="flex flex-col gap-1">
						<span class="font-mono text-xs text-primary">03 · download</span>
						<span class="text-sm text-muted"
							>Fetch VTT or SRT with a single authenticated call.</span
						>
					</li>
				</ul>
			</div>

			<div class="min-w-0">
				<CfFrame>
					<CodeWindow variant="embedded" showTrafficLights={false}>
						{#snippet title()}request.headers{/snippet}
						{#snippet titleTrailing()}HTTP{/snippet}
						<div
							class="auth-panel overflow-x-auto px-4 py-4 font-mono text-[0.75rem] leading-relaxed sm:text-xs"
						>
							<span class="json-key">Authorization</span><span class="json-punct">:</span>
							<span class="json-boolean">Bearer</span>
							<span class="json-string">&lt;your_api_key&gt;</span>
						</div>
						<div class="border-t border-border px-4 py-3 font-mono text-[0.7rem] leading-relaxed">
							<p class="text-gray-600"># then call</p>
							<p class="mt-1.5 truncate">
								<span class="json-method">GET</span>
								<span class="text-gray-400"> /api/search?imdb=tt0111161&amp;lang=en</span>
							</p>
						</div>
					</CodeWindow>
				</CfFrame>
			</div>
		</div>
	</div>
</section>

<style>
	.auth-panel {
		color: #a1a1aa;
	}
</style>
