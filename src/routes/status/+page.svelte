<script lang="ts">
	import { Icon } from '#lib/components/ui/icon/index.js';

	import { providerStatus } from '../subs.remote.js';

	const providers = await providerStatus();
</script>

<section class="space-y-6">
	<div class="space-y-2">
		<h1 class="text-3xl font-semibold tracking-tight">Provider status</h1>
		<p class="text-muted">Last observed health from this process (in-memory).</p>
	</div>

	<ul class="grid gap-3 sm:grid-cols-2">
		{#each providers as p (p.id)}
			<li class="rounded-card border border-border bg-surface p-4">
				<div class="flex items-center justify-between gap-2">
					<p class="font-medium">{p.id}</p>
					{#if p.ok}
						<span class="inline-flex items-center gap-1 text-xs text-primary-300">
							<Icon icon="lucide:check-circle-2" class="size-4" />
							ok
						</span>
					{:else}
						<span class="inline-flex items-center gap-1 text-xs text-favorite">
							<Icon icon="lucide:triangle-alert" class="size-4" />
							error
						</span>
					{/if}
				</div>
				<p class="mt-2 text-xs text-muted">
					Latency: {p.latencyMs == null ? '—' : `${p.latencyMs}ms`}
				</p>
				<p class="mt-1 text-xs text-muted">
					Checked: {p.lastCheckedAt === new Date(0).toISOString()
						? 'never'
						: new Date(p.lastCheckedAt).toLocaleString()}
				</p>
				{#if p.lastError}
					<p class="mt-2 text-xs text-favorite">{p.lastError}</p>
				{/if}
			</li>
		{/each}
	</ul>
</section>
