<script lang="ts">
	import { Icon } from '#lib/components/ui/icon/index.js';

	import { usePlan } from './context.svelte.js';

	const ctx = usePlan();
</script>

{#if ctx.plan.features.length}
	<ul class="flex flex-col gap-2 text-sm">
		{#each ctx.plan.features as feature (feature)}
			<li class="flex items-start gap-2">
				<Icon icon="lucide:check" class="mt-0.5 size-4 shrink-0 text-primary" />
				<span>{feature}</span>
			</li>
		{/each}
	</ul>
{/if}
