<script lang="ts">
	import { usePlan } from './context.svelte.js';

	const ctx = usePlan();
</script>

{#if ctx.plan.description}
	<p class="text-sm text-muted">{ctx.plan.description}</p>
{/if}
