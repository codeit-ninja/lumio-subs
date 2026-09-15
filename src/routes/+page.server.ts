import { isFreePlan } from '#lib/billing/plan.js';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const plansResult = await locals.services.subscriptions().listActivePlans();
	const plans = plansResult.unwrapOr([]);

	let activePlanId: string | null = null;
	let hasPaidSubscription = false;

	if (locals.user) {
		const entitlement = await locals.services
			.subscriptions()
			.ensureFreeSubscription(locals.user.id);
		if (entitlement.isOk()) {
			activePlanId = entitlement.value.plan.id;
			hasPaidSubscription = !isFreePlan(entitlement.value.plan);
		}
	}

	return {
		plans,
		activePlanId,
		hasPaidSubscription,
		stripeConfigured: locals.services.stripe().isConfigured()
	};
};
