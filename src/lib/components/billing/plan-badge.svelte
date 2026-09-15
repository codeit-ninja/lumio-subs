<script lang="ts">
	import { usePlan } from './context.svelte.js';

	const ctx = usePlan();
</script>

{#if ctx.plan.highlighted}
	<p class="text-xs font-medium tracking-wide text-primary uppercase">Popular</p>
{/if}
