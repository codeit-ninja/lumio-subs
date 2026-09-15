import { z } from 'zod';

export const planIntervalSchema = z.enum(['month', 'year']);

export const planSlugSchema = z.enum(['free', 'start', 'pro', 'pro_plus']);

export const planSchema = z.object({
	id: z.string().min(1),
	slug: planSlugSchema.or(z.string().min(1)),
	name: z.string().min(1),
	description: z
		.string()
		.nullish()
		.transform((value) => value ?? null),
	features: z
		.array(z.string())
		.nullish()
		.transform((value) => value ?? []),
	priceCents: z.number().int().nonnegative(),
	currency: z.string().min(1).default('eur'),
	interval: planIntervalSchema,
	stripePriceId: z
		.string()
		.nullish()
		.transform((value) => value?.trim() || null),
	active: z.boolean().default(true),
	highlighted: z.boolean().default(false),
	sortOrder: z.number().int().default(0),
	limitPerSecond: z.number().int().positive(),
	limitPerMinute: z.number().int().positive(),
	limitPerHour: z.number().int().positive(),
	limitPerDay: z.number().int().positive(),
	limitPerMonth: z.number().int().positive()
});

export type Plan = z.infer<typeof planSchema>;

export function parsePlan(raw: unknown): Plan | null {
	const result = planSchema.safeParse(raw);
	return result.success ? result.data : null;
}

export function isFreePlan(plan: Plan): boolean {
	return plan.slug === 'free' || plan.priceCents === 0 || !plan.stripePriceId;
}

export function isPaidCheckoutPlan(plan: Plan): boolean {
	return Boolean(plan.stripePriceId) && plan.slug !== 'free' && plan.priceCents > 0;
}

export const subscriptionStatusSchema = z.enum([
	'active',
	'trialing',
	'past_due',
	'canceled',
	'incomplete',
	'unpaid'
]);

export const subscriptionSchema = z.object({
	id: z.string().min(1),
	user: z.string().min(1),
	plan: z.string().min(1),
	stripeCustomerId: z
		.string()
		.nullish()
		.transform((value) => value?.trim() || null),
	stripeSubscriptionId: z
		.string()
		.nullish()
		.transform((value) => value?.trim() || null),
	status: subscriptionStatusSchema,
	currentPeriodEnd: z
		.string()
		.nullish()
		.transform((value) => value ?? null)
});

export type Subscription = z.infer<typeof subscriptionSchema>;

export function parseSubscription(raw: unknown): Subscription | null {
	const result = subscriptionSchema.safeParse(raw);
	return result.success ? result.data : null;
}

export function isActiveSubscriptionStatus(status: string): boolean {
	return status === 'active' || status === 'trialing';
}

export const apiKeyPublicSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	keyPrefix: z.string().min(1),
	expiresAt: z
		.string()
		.nullish()
		.transform((value) => value ?? null),
	revokedAt: z
		.string()
		.nullish()
		.transform((value) => value ?? null),
	lastUsedAt: z
		.string()
		.nullish()
		.transform((value) => value ?? null),
	created: z
		.string()
		.nullish()
		.transform((value) => value ?? null)
});

export type ApiKeyPublic = z.infer<typeof apiKeyPublicSchema>;

export function parseApiKeyPublic(raw: unknown): ApiKeyPublic | null {
	const result = apiKeyPublicSchema.safeParse(raw);
	return result.success ? result.data : null;
}
