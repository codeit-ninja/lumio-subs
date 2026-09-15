<script lang="ts">
	import { isFreePlan } from '#lib/billing/plan.js';

	import { usePlan } from './context.svelte.js';

	const ctx = usePlan();

	const free = $derived(isFreePlan(ctx.plan));

	const priceLabel = $derived(
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: ctx.plan.currency.toUpperCase()
		}).format(ctx.plan.priceCents / 100)
	);

	const intervalLabel = $derived(free ? '' : ctx.plan.interval === 'year' ? '/ year' : '/ month');
</script>

<p class="flex items-baseline gap-1">
	<span class="text-3xl font-semibold tracking-tight">{priceLabel}</span>
	{#if intervalLabel}
		<span class="text-sm text-muted">{intervalLabel}</span>
	{/if}
</p>
