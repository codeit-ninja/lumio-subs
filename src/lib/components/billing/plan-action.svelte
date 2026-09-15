<script lang="ts">
	import { isFreePlan, isPaidCheckoutPlan } from '#lib/billing/plan.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Icon } from '#lib/components/ui/icon/index.js';

	import { usePlan } from './context.svelte.js';

	const ctx = usePlan();

	const free = $derived(isFreePlan(ctx.plan));
	const canCheckout = $derived(isPaidCheckoutPlan(ctx.plan) && ctx.stripeConfigured);
</script>

{#if !ctx.loggedIn}
	<Button href="/login" class="w-full" variant={ctx.plan.highlighted ? 'primary' : 'secondary'}>
		{free ? 'Sign in to get started' : 'Sign in to subscribe'}
	</Button>
{:else if ctx.isCurrentPlan}
	{#if free}
		<Button type="button" class="w-full" variant="secondary" disabled>Current plan</Button>
	{:else}
		<Button
			type="button"
			class="w-full"
			variant="secondary"
			loading={ctx.portalPending}
			onclick={ctx.onPortal}
		>
			Manage billing
		</Button>
	{/if}
{:else if free}
	<Button type="button" class="w-full" variant="secondary" disabled>Included</Button>
{:else if ctx.hasPaidSubscription}
	<Button
		type="button"
		class="w-full"
		variant="secondary"
		loading={ctx.portalPending}
		onclick={ctx.onPortal}
	>
		Change plan
	</Button>
{:else if !canCheckout}
	<Button type="button" class="w-full" variant="secondary" disabled>Coming soon</Button>
{:else}
	<Button
		type="button"
		class="w-full"
		variant={ctx.plan.highlighted ? 'primary' : 'secondary'}
		loading={ctx.checkoutPending}
		onclick={() => ctx.onCheckout(ctx.plan.id)}
	>
		Subscribe
		<Icon icon="lucide:arrow-right" class="size-4 shrink-0" />
	</Button>
{/if}
