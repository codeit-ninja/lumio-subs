<script lang="ts">
	import type { Plan as BillingPlan } from '#lib/billing/plan.js';
	import * as Plan from '#lib/components/billing/index.js';

	import { openBillingPortal, startCheckout } from '../../../routes/billing.remote.js';
	import CfFrame from './cf-frame.svelte';

	let {
		plans,
		activePlanId,
		hasPaidSubscription,
		stripeConfigured,
		loggedIn
	}: {
		plans: BillingPlan[];
		activePlanId: string | null;
		hasPaidSubscription: boolean;
		stripeConfigured: boolean;
		loggedIn: boolean;
	} = $props();

	let checkoutPlanId = $state<string | null>(null);
	let portalPending = $state(false);
	let billingError = $state<string | null>(null);

	async function handleCheckout(planId: string) {
		billingError = null;
		checkoutPlanId = planId;
		try {
			const result = await startCheckout({ planId });
			if (result && typeof result === 'object' && 'ok' in result && result.ok === false) {
				billingError = result.message;
			}
		} catch {
			// redirect throws
		} finally {
			checkoutPlanId = null;
		}
	}

	async function handlePortal() {
		billingError = null;
		portalPending = true;
		try {
			const result = await openBillingPortal();
			if (result && typeof result === 'object' && 'ok' in result && result.ok === false) {
				billingError = result.message;
			}
		} catch {
			// redirect
		} finally {
			portalPending = false;
		}
	}
</script>

<section id="pricing" class="scroll-mt-20 px-4 py-20 sm:py-24">
	<CfFrame marks="pricing" class="mx-auto max-w-6xl">
		<div class="border-b border-border px-6 py-8 sm:px-8">
			<h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Pricing</h2>
			<p class="mt-3 max-w-2xl text-muted">
				Every account starts on Free. Upgrade for higher rate limits when your app grows.
			</p>
			{#if billingError}
				<p class="mt-4 text-sm text-red-400">{billingError}</p>
			{/if}
		</div>

		{#if plans.length === 0}
			<p class="px-6 py-10 text-muted sm:px-8">No plans published yet.</p>
		{:else}
			<div class="plan-grid grid sm:grid-cols-2 xl:grid-cols-4">
				{#each plans as plan, i (plan.id)}
					<div class="plan-card relative h-full" style="--plan-i: {i}">
						<Plan.Root
							{plan}
							{loggedIn}
							{hasPaidSubscription}
							isCurrentPlan={activePlanId === plan.id}
							{stripeConfigured}
							onCheckout={handleCheckout}
							onPortal={handlePortal}
							checkoutPending={checkoutPlanId === plan.id}
							{portalPending}
							class="plan-cell h-full rounded-none border-0 border-r border-b border-border bg-transparent p-6 shadow-none ring-0 sm:p-8 {plan.highlighted
								? 'highlighted bg-surface/50'
								: ''}"
						>
							<div class="flex flex-col gap-1">
								<Plan.Badge />
								<Plan.Name />
								<Plan.Description />
								<Plan.Limits />
							</div>
							<Plan.Price />
							<Plan.Features />
							<div class="mt-auto pt-2">
								<Plan.Action />
							</div>
						</Plan.Root>
					</div>
				{/each}
			</div>
		{/if}
	</CfFrame>
</section>

<style>
	.plan-card {
		animation: plan-in 0.55s ease-out both;
		animation-delay: calc(var(--plan-i, 0) * 70ms);
	}

	.plan-grid :global(.plan-cell.highlighted) {
		box-shadow: inset 0 0 0 1px var(--color-primary);
	}

	@media (min-width: 640px) {
		.plan-grid > :nth-child(2n) :global(.plan-cell) {
			border-right-width: 0;
		}

		.plan-grid > :nth-child(-n + 2) :global(.plan-cell) {
			border-bottom-width: 1px;
		}

		.plan-grid > :nth-child(n + 3) :global(.plan-cell) {
			border-bottom-width: 0;
		}
	}

	@media (min-width: 1280px) {
		.plan-grid > :nth-child(2n) :global(.plan-cell) {
			border-right-width: 1px;
		}

		.plan-grid > :last-child :global(.plan-cell) {
			border-right-width: 0;
		}

		.plan-grid > :nth-child(-n + 2) :global(.plan-cell),
		.plan-grid > :nth-child(n + 3) :global(.plan-cell) {
			border-bottom-width: 0;
		}
	}

	@keyframes plan-in {
		from {
			opacity: 0;
			transform: translateY(0.6rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.plan-card {
			animation: none;
		}
	}
</style>
