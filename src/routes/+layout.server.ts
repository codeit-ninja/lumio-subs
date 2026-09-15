import { isFreePlan } from '#lib/billing/plan.js';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	let hasPaidSubscription = false;

	if (locals.user) {
		const entitlement = await locals.services.subscriptions().getEntitlement(locals.user.id);
		if (entitlement.isOk() && entitlement.value) {
			hasPaidSubscription = !isFreePlan(entitlement.value.plan);
		} else if (locals.user.stripeCustomerId) {
			hasPaidSubscription = true;
		}
	}

	return {
		user: locals.user,
		hasPaidSubscription
	};
};
