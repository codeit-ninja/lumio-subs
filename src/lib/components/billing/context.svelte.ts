import { createContext } from 'svelte';

import type { Plan } from '#lib/billing/plan.js';

export type PlanContext = {
	plan: Plan;
	loggedIn: boolean;
	isCurrentPlan: boolean;
	hasPaidSubscription: boolean;
	stripeConfigured: boolean;
	onCheckout: (planId: string) => void;
	onPortal: () => void;
	checkoutPending: boolean;
	portalPending: boolean;
};

export const [usePlan, createPlan] = createContext<PlanContext>();
