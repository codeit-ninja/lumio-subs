<script lang="ts">
	import type { Plan as BillingPlan } from '#lib/billing/plan.js';
	import * as Marketing from '#lib/components/marketing/index.js';
	import { page } from '$app/state';

	let {
		data
	}: {
		data: {
			plans: BillingPlan[];
			activePlanId: string | null;
			hasPaidSubscription: boolean;
			stripeConfigured: boolean;
		};
	} = $props();

	const user = $derived(page.data.user as { id: string; email: string } | null);
	const loggedIn = $derived(Boolean(user));
</script>

<div class="marketing-home">
	<Marketing.Hero {loggedIn} />
	<Marketing.Benefits />
	<Marketing.About />
	<Marketing.Pricing
		plans={data.plans}
		activePlanId={data.activePlanId}
		hasPaidSubscription={data.hasPaidSubscription}
		stripeConfigured={data.stripeConfigured}
		{loggedIn}
	/>
</div>
