<script lang="ts">
	import { usePlan } from './context.svelte.js';

	const ctx = usePlan();

	const limitSummary = $derived(
		`${ctx.plan.limitPerDay.toLocaleString()}/day · ${ctx.plan.limitPerSecond}/s`
	);
</script>

<p class="text-xs text-muted">{limitSummary}</p>
