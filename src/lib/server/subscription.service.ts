import type { ResultAsync } from 'neverthrow';
import { errAsync, ok, okAsync } from 'neverthrow';
import type { ListResult, RecordModel } from 'pocketbase';
import type Stripe from 'stripe';

import type { AppUser } from '#lib/auth/user.js';
import type { Plan, Subscription } from '#lib/billing/plan.js';
import {
	isFreePlan,
	isPaidCheckoutPlan,
	parsePlan,
	parseSubscription,
	subscriptionStatusSchema
} from '#lib/billing/plan.js';

import { Service } from './base.service';
import type { AppError } from './result';
import { ERROR_CODE, fromPb, panic } from './result';

export type Entitlement = {
	subscription: Subscription;
	plan: Plan;
};

export class SubscriptionService extends Service {
	listActivePlans(): ResultAsync<Plan[], AppError> {
		return fromPb<ListResult<RecordModel>>(
			this.pocketbase.collection('plans').getList(1, 50, {
				filter: 'active = true',
				sort: 'sortOrder,name'
			})
		).map((result) =>
			result.items
				.map((item) => parsePlan(normalizePlanRecord(item)))
				.filter((plan): plan is Plan => plan !== null)
		);
	}

	getPlan(planId: string, opts?: { requireActive?: boolean }): ResultAsync<Plan, AppError> {
		const requireActive = opts?.requireActive ?? true;
		return fromPb<RecordModel>(this.pocketbase.collection('plans').getOne(planId)).andThen(
			(record) => {
				const plan = parsePlan(normalizePlanRecord(record));
				if (!plan) {
					return panic(ERROR_CODE.BILLING_PLAN_NOT_FOUND, 404, 'Invalid plan record');
				}
				if (requireActive && !plan.active) {
					return panic(ERROR_CODE.BILLING_PLAN_NOT_FOUND, 404, 'Plan is not available');
				}
				return ok(plan);
			}
		);
	}

	getPlanBySlug(slug: string): ResultAsync<Plan, AppError> {
		return fromPb<RecordModel>(
			this.pocketbase
				.collection('plans')
				.getFirstListItem(this.pocketbase.filter('slug = {:slug}', { slug }))
		).andThen((record) => {
			const plan = parsePlan(normalizePlanRecord(record));
			if (!plan) {
				return panic(ERROR_CODE.BILLING_PLAN_NOT_FOUND, 404, 'Invalid free plan record');
			}
			return ok(plan);
		});
	}

	getPlanByStripePriceId(stripePriceId: string): ResultAsync<Plan | null, AppError> {
		return fromPb<RecordModel>(
			this.pocketbase
				.collection('plans')
				.getFirstListItem(
					this.pocketbase.filter('stripePriceId = {:stripePriceId}', { stripePriceId })
				)
		)
			.map((record) => parsePlan(normalizePlanRecord(record)))
			.orElse((error) => {
				if (error.kind === 'BACKEND' && error.status === 404) {
					return okAsync(null);
				}
				return errAsync(error);
			});
	}

	assignFreePlan(userId: string): ResultAsync<Entitlement, AppError> {
		return this.ensureFreeSubscription(userId);
	}

	ensureFreeSubscription(userId: string): ResultAsync<Entitlement, AppError> {
		return this.getEntitlement(userId).andThen((existing) => {
			if (existing) return okAsync(existing);

			return this.getPlanBySlug('free').andThen((plan) =>
				fromPb<RecordModel>(
					this.pocketbase.collection('subscriptions').create({
						user: userId,
						plan: plan.id,
						status: 'active',
						stripeCustomerId: '',
						stripeSubscriptionId: ''
					})
				).andThen((record) => {
					const subscription = parseSubscription(normalizeSubscriptionRecord(record));
					if (!subscription) {
						return errAsync({
							kind: 'BACKEND' as const,
							code: ERROR_CODE.BILLING_WEBHOOK,
							status: 500,
							message: 'Failed to create free subscription'
						});
					}
					return okAsync({ subscription, plan });
				})
			);
		});
	}

	/**
	 * Prefer a paid active/trialing subscription; otherwise free (null if none yet).
	 */
	getEntitlement(userId: string): ResultAsync<Entitlement | null, AppError> {
		return fromPb<ListResult<RecordModel>>(
			this.pocketbase.collection('subscriptions').getList(1, 20, {
				filter: this.pocketbase.filter(
					'user = {:userId} && (status = "active" || status = "trialing")',
					{ userId }
				),
				sort: '-updated'
			})
		).andThen((result) => {
			const subscriptions = result.items
				.map((item) => parseSubscription(normalizeSubscriptionRecord(item)))
				.filter((sub): sub is Subscription => sub !== null);

			if (subscriptions.length === 0) return okAsync(null);

			return subscriptions
				.reduce<ResultAsync<Entitlement[], AppError>>(
					(acc, subscription) =>
						acc.andThen((list) =>
							this.getPlan(subscription.plan, { requireActive: false })
								.map((plan) => [...list, { subscription, plan }])
								.orElse(() => okAsync(list))
						),
					okAsync([])
				)
				.map((entitlements) => {
					const paid = entitlements.find((e) => !isFreePlan(e.plan));
					return paid ?? entitlements[0] ?? null;
				});
		});
	}

	hasActiveSubscription(userId: string): ResultAsync<boolean, AppError> {
		return this.getEntitlement(userId).map((entitlement) => entitlement !== null);
	}

	getActiveSubscription(userId: string): ResultAsync<Subscription | null, AppError> {
		return this.getEntitlement(userId).map((entitlement) => entitlement?.subscription ?? null);
	}

	ensureStripeCustomer(user: AppUser): ResultAsync<string, AppError> {
		if (user.stripeCustomerId) {
			return okAsync(user.stripeCustomerId);
		}

		return this.ctx.locals.services
			.stripe()
			.createCustomer({
				userId: user.id,
				email: user.email,
				name: user.name
			})
			.andThen((customerId) =>
				fromPb<RecordModel>(
					this.pocketbase.collection('users').update(user.id, { stripeCustomerId: customerId })
				).map(() => {
					if (this.ctx.locals.user?.id === user.id) {
						this.ctx.locals.user = { ...this.ctx.locals.user, stripeCustomerId: customerId };
					}
					return customerId;
				})
			);
	}

	startCheckout(user: AppUser, planId: string): ResultAsync<{ url: string }, AppError> {
		const stripe = this.ctx.locals.services.stripe();
		if (!stripe.isConfigured()) {
			return errAsync({
				kind: 'config',
				code: ERROR_CODE.CONFIG_MISSING,
				message: 'Stripe is not configured'
			});
		}

		return this.getPlan(planId).andThen((plan) => {
			if (!isPaidCheckoutPlan(plan) || !plan.stripePriceId) {
				return errAsync({
					kind: 'BACKEND' as const,
					code: ERROR_CODE.BILLING_CHECKOUT_UNAVAILABLE,
					status: 400,
					message: 'This plan cannot be purchased via Stripe Checkout'
				});
			}

			return this.ensureStripeCustomer(user).andThen((customerId) =>
				stripe.createCheckoutSession({ user, plan, customerId })
			);
		});
	}

	openBillingPortal(user: AppUser): ResultAsync<{ url: string }, AppError> {
		const stripe = this.ctx.locals.services.stripe();
		if (!stripe.isConfigured()) {
			return errAsync({
				kind: 'config',
				code: ERROR_CODE.CONFIG_MISSING,
				message: 'Stripe is not configured'
			});
		}

		const customerId = user.stripeCustomerId;
		if (!customerId) {
			return errAsync({
				kind: 'BACKEND',
				code: ERROR_CODE.BILLING_NO_CUSTOMER,
				status: 400,
				message: 'No Stripe customer on this account'
			});
		}

		return stripe.createPortalSession({ customerId });
	}

	handleStripeEvent(event: Stripe.Event): ResultAsync<void, AppError> {
		switch (event.type) {
			case 'checkout.session.completed':
				return this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
			case 'customer.subscription.updated':
			case 'customer.subscription.deleted':
				return this.upsertFromStripeSubscription(event.data.object as Stripe.Subscription).andThen(
					() => {
						if (event.type !== 'customer.subscription.deleted') {
							return okAsync(undefined);
						}
						const sub = event.data.object as Stripe.Subscription;
						const userId = sub.metadata?.userId;
						if (!userId) return okAsync(undefined);
						return this.ensureFreeSubscription(userId).map(() => undefined);
					}
				);
			case 'invoice.paid':
			case 'invoice.payment_failed':
				return this.onInvoiceEvent(event.data.object as Stripe.Invoice);
			default:
				return okAsync(undefined);
		}
	}

	private onCheckoutCompleted(session: Stripe.Checkout.Session): ResultAsync<void, AppError> {
		const subscriptionId =
			typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

		if (!subscriptionId) {
			return okAsync(undefined);
		}

		return this.ctx.locals.services
			.stripe()
			.retrieveSubscription(subscriptionId)
			.andThen((subscription) => this.upsertFromStripeSubscription(subscription, session));
	}

	private onInvoiceEvent(invoice: Stripe.Invoice): ResultAsync<void, AppError> {
		const subscriptionId = extractInvoiceSubscriptionId(invoice);
		if (!subscriptionId) return okAsync(undefined);

		return this.ctx.locals.services
			.stripe()
			.retrieveSubscription(subscriptionId)
			.andThen((subscription) => this.upsertFromStripeSubscription(subscription));
	}

	private upsertFromStripeSubscription(
		subscription: Stripe.Subscription,
		session?: Stripe.Checkout.Session
	): ResultAsync<void, AppError> {
		const userId =
			subscription.metadata?.userId ||
			session?.metadata?.userId ||
			session?.client_reference_id ||
			null;

		const planIdFromMeta = subscription.metadata?.planId || session?.metadata?.planId || null;
		const priceId = subscription.items.data[0]?.price?.id ?? null;
		const customerId =
			typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

		const statusResult = subscriptionStatusSchema.safeParse(subscription.status);
		const status = statusResult.success ? statusResult.data : 'incomplete';
		const periodEndUnix = subscription.items.data[0]?.current_period_end;
		const currentPeriodEnd =
			typeof periodEndUnix === 'number' ? new Date(periodEndUnix * 1000).toISOString() : null;

		const resolvePlan = (): ResultAsync<Plan, AppError> => {
			if (planIdFromMeta) {
				return this.getPlan(planIdFromMeta, { requireActive: false }).orElse(() => {
					if (!priceId) {
						return errAsync({
							kind: 'BACKEND' as const,
							code: ERROR_CODE.BILLING_PLAN_NOT_FOUND,
							status: 404,
							message: 'Plan not found'
						});
					}
					return this.getPlanByStripePriceId(priceId).andThen((plan) =>
						plan
							? okAsync(plan)
							: errAsync({
									kind: 'BACKEND' as const,
									code: ERROR_CODE.BILLING_PLAN_NOT_FOUND,
									status: 404,
									message: 'Plan not found for Stripe price'
								})
					);
				});
			}
			if (!priceId) {
				return errAsync({
					kind: 'BACKEND' as const,
					code: ERROR_CODE.BILLING_PLAN_NOT_FOUND,
					status: 404,
					message: 'Missing Stripe price on subscription'
				});
			}
			return this.getPlanByStripePriceId(priceId).andThen((plan) =>
				plan
					? okAsync(plan)
					: errAsync({
							kind: 'BACKEND' as const,
							code: ERROR_CODE.BILLING_PLAN_NOT_FOUND,
							status: 404,
							message: 'Plan not found for Stripe price'
						})
			);
		};

		const resolveUserId = (): ResultAsync<string, AppError> => {
			if (userId) return okAsync(userId);
			return fromPb<RecordModel>(
				this.pocketbase
					.collection('users')
					.getFirstListItem(
						this.pocketbase.filter('stripeCustomerId = {:customerId}', { customerId })
					)
			)
				.map((record) => record.id)
				.orElse((error) =>
					errAsync({
						kind: 'BACKEND' as const,
						code: ERROR_CODE.BILLING_WEBHOOK,
						status: error.kind === 'BACKEND' ? error.status : 400,
						message: 'Could not resolve user for Stripe subscription'
					})
				);
		};

		return resolveUserId().andThen((resolvedUserId) =>
			resolvePlan().andThen((plan) =>
				this.syncUserStripeCustomer(resolvedUserId, customerId).andThen(() =>
					this.upsertSubscriptionRecord({
						userId: resolvedUserId,
						planId: plan.id,
						stripeCustomerId: customerId,
						stripeSubscriptionId: subscription.id,
						status,
						currentPeriodEnd
					}).andThen(() => {
						if (status === 'canceled' || status === 'unpaid') {
							return this.ensureFreeSubscription(resolvedUserId).map(() => undefined);
						}
						return okAsync(undefined);
					})
				)
			)
		);
	}

	private syncUserStripeCustomer(userId: string, customerId: string): ResultAsync<void, AppError> {
		return fromPb<RecordModel>(this.pocketbase.collection('users').getOne(userId)).andThen(
			(record) => {
				if (record.stripeCustomerId === customerId) {
					return okAsync(undefined);
				}
				return fromPb(
					this.pocketbase.collection('users').update(userId, { stripeCustomerId: customerId })
				).map(() => undefined);
			}
		);
	}

	private upsertSubscriptionRecord(input: {
		userId: string;
		planId: string;
		stripeCustomerId: string;
		stripeSubscriptionId: string;
		status: Subscription['status'];
		currentPeriodEnd: string | null;
	}): ResultAsync<void, AppError> {
		const payload = {
			user: input.userId,
			plan: input.planId,
			stripeCustomerId: input.stripeCustomerId,
			stripeSubscriptionId: input.stripeSubscriptionId,
			status: input.status,
			currentPeriodEnd: input.currentPeriodEnd
		};

		return fromPb<ListResult<RecordModel>>(
			this.pocketbase.collection('subscriptions').getList(1, 1, {
				filter: this.pocketbase.filter('stripeSubscriptionId = {:id}', {
					id: input.stripeSubscriptionId
				})
			})
		).andThen((existing) => {
			const record = existing.items[0];
			if (record) {
				return fromPb(this.pocketbase.collection('subscriptions').update(record.id, payload)).map(
					() => undefined
				);
			}
			return fromPb(this.pocketbase.collection('subscriptions').create(payload)).map(
				() => undefined
			);
		});
	}
}

function normalizePlanRecord(record: RecordModel): Record<string, unknown> {
	return {
		id: record.id,
		slug: record.slug,
		name: record.name,
		description: record.description,
		features: record.features,
		priceCents: record.priceCents,
		currency: record.currency,
		interval: record.interval,
		stripePriceId: record.stripePriceId,
		active: record.active,
		highlighted: record.highlighted,
		sortOrder: record.sortOrder,
		limitPerSecond: record.limitPerSecond,
		limitPerMinute: record.limitPerMinute,
		limitPerHour: record.limitPerHour,
		limitPerDay: record.limitPerDay,
		limitPerMonth: record.limitPerMonth
	};
}

function normalizeSubscriptionRecord(record: RecordModel): Record<string, unknown> {
	return {
		id: record.id,
		user: record.user,
		plan: record.plan,
		stripeCustomerId: record.stripeCustomerId,
		stripeSubscriptionId: record.stripeSubscriptionId,
		status: record.status,
		currentPeriodEnd: record.currentPeriodEnd
	};
}

function extractInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
	const raw = invoice as Stripe.Invoice & {
		subscription?: string | { id: string } | null;
		parent?: {
			subscription_details?: { subscription?: string | { id: string } | null } | null;
		} | null;
	};

	const direct = raw.subscription;
	if (typeof direct === 'string') return direct;
	if (direct && typeof direct === 'object' && 'id' in direct) return direct.id;

	const nested = raw.parent?.subscription_details?.subscription;
	if (typeof nested === 'string') return nested;
	if (nested && typeof nested === 'object' && 'id' in nested) return nested.id;

	return null;
}
