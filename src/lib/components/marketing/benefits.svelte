<script lang="ts">
	import CfFrame from './cf-frame.svelte';
</script>

<section class="benefits relative px-4 py-16 sm:py-20">
	<CfFrame marks="benefits" dashed class="mx-auto max-w-6xl">
		<div class="grid sm:grid-cols-3">
			<div class="flex flex-col gap-3 border-b border-border p-6 sm:border-r sm:border-b-0 sm:p-8">
				<p class="font-mono text-[0.65rem] tracking-wider text-muted uppercase">01</p>
				<h2 class="text-base font-semibold tracking-tight">Multi-provider search</h2>
				<p class="text-sm leading-relaxed text-pretty text-muted">
					Query IMDb or TMDB once and search across every enabled subtitle source in parallel.
				</p>
			</div>
			<div class="flex flex-col gap-3 border-b border-border p-6 sm:border-r sm:border-b-0 sm:p-8">
				<p class="font-mono text-[0.65rem] tracking-wider text-muted uppercase">02</p>
				<h2 class="text-base font-semibold tracking-tight">Normalized JSON</h2>
				<p class="text-sm leading-relaxed text-pretty text-muted">
					One consistent response shape — language, release, provider, and download URL — every
					time.
				</p>
			</div>
			<div class="flex flex-col gap-3 p-6 sm:p-8">
				<p class="font-mono text-[0.65rem] tracking-wider text-muted uppercase">03</p>
				<h2 class="text-base font-semibold tracking-tight">VTT &amp; SRT downloads</h2>
				<p class="text-sm leading-relaxed text-pretty text-muted">
					Authenticate once, then pull subtitle files your media app or backend can use immediately.
				</p>
			</div>
		</div>
	</CfFrame>
</section>
