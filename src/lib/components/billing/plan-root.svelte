<script lang="ts">
	import type { Snippet } from 'svelte';

	import type { Plan } from '#lib/billing/plan.js';

	import { createPlan } from './context.svelte.js';

	type Props = {
		plan: Plan;
		loggedIn: boolean;
		isCurrentPlan: boolean;
		hasPaidSubscription: boolean;
		stripeConfigured: boolean;
		onCheckout: (planId: string) => void;
		onPortal: () => void;
		checkoutPending?: boolean;
		portalPending?: boolean;
		class?: string;
		children?: Snippet;
	};

	let {
		plan,
		loggedIn,
		isCurrentPlan,
		hasPaidSubscription,
		stripeConfigured,
		onCheckout,
		onPortal,
		checkoutPending = false,
		portalPending = false,
		class: className,
		children
	}: Props = $props();

	createPlan({
		get plan() {
			return plan;
		},
		get loggedIn() {
			return loggedIn;
		},
		get isCurrentPlan() {
			return isCurrentPlan;
		},
		get hasPaidSubscription() {
			return hasPaidSubscription;
		},
		get stripeConfigured() {
			return stripeConfigured;
		},
		get onCheckout() {
			return onCheckout;
		},
		get onPortal() {
			return onPortal;
		},
		get checkoutPending() {
			return checkoutPending;
		},
		get portalPending() {
			return portalPending;
		}
	});
</script>

<article
	class={[
		'flex flex-col gap-5 rounded-card border border-border bg-surface p-6',
		plan.highlighted && !className?.includes('highlighted') && 'ring-2 ring-primary',
		className
	]}
>
	{@render children?.()}
</article>
