import { randomBytes } from 'node:crypto';

import type { ResultAsync } from 'neverthrow';
import { errAsync, okAsync, ResultAsync as RA } from 'neverthrow';
import Stripe from 'stripe';

import type { AppUser } from '#lib/auth/user.js';
import type { Plan } from '#lib/billing/plan.js';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$app/env/private';

import { Service } from './base.service';
import type { AppError } from './result';
import { configError, ERROR_CODE, requireConfig } from './result';

export class StripeService extends Service {
	isConfigured(): boolean {
		return Boolean(STRIPE_SECRET_KEY?.trim());
	}

	createCheckoutSession(input: {
		user: AppUser;
		plan: Plan;
		customerId: string | null;
	}): ResultAsync<{ url: string }, AppError> {
		return this.client().andThen((stripe) => {
			const origin = this.ctx.url.origin;
			const suffix = randomBytes(4).toString('hex');

			return this.fromStripe(
				stripe.checkout.sessions.create({
					mode: 'subscription',
					customer: input.customerId ?? undefined,
					customer_email: input.customerId ? undefined : input.user.email || undefined,
					client_reference_id: input.user.id,
					line_items: [{ price: input.plan.stripePriceId!, quantity: 1 }],
					success_url: `${origin}/?checkout=success`,
					cancel_url: `${origin}/#pricing`,
					metadata: {
						userId: input.user.id,
						planId: input.plan.id
					},
					subscription_data: {
						metadata: {
							userId: input.user.id,
							planId: input.plan.id
						}
					},
					integration_identifier: `subrest_checkout_${suffix}`
				})
			).andThen((session) => {
				if (!session.url) {
					return errAsync({
						kind: 'BACKEND' as const,
						code: ERROR_CODE.BILLING_STRIPE,
						status: 502,
						message: 'Stripe Checkout session missing URL'
					});
				}
				return okAsync({ url: session.url });
			});
		});
	}

	createPortalSession(input: {
		customerId: string;
		returnUrl?: string;
	}): ResultAsync<{ url: string }, AppError> {
		return this.client().andThen((stripe) =>
			this.fromStripe(
				stripe.billingPortal.sessions.create({
					customer: input.customerId,
					return_url: input.returnUrl ?? `${this.ctx.url.origin}/#pricing`
				})
			).map((session) => ({ url: session.url }))
		);
	}

	createCustomer(input: {
		userId: string;
		email: string;
		name?: string | null;
	}): ResultAsync<string, AppError> {
		return this.client().andThen((stripe) =>
			this.fromStripe(
				stripe.customers.create({
					email: input.email,
					name: input.name ?? undefined,
					metadata: { userId: input.userId }
				})
			).map((customer) => customer.id)
		);
	}

	constructEvent(rawBody: string, signature: string): ResultAsync<Stripe.Event, AppError> {
		return requireConfig(STRIPE_SECRET_KEY?.trim(), 'STRIPE_SECRET_KEY').andThen((secret) =>
			requireConfig(STRIPE_WEBHOOK_SECRET?.trim(), 'STRIPE_WEBHOOK_SECRET').andThen(
				(webhookSecret) => {
					const stripe = new Stripe(secret);
					try {
						const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
						return okAsync(event);
					} catch (e) {
						return errAsync({
							kind: 'BACKEND' as const,
							code: ERROR_CODE.BILLING_WEBHOOK,
							status: 400,
							message: e instanceof Error ? e.message : 'Invalid Stripe webhook signature'
						});
					}
				}
			)
		);
	}

	retrieveSubscription(subscriptionId: string): ResultAsync<Stripe.Subscription, AppError> {
		return this.client().andThen((stripe) =>
			this.fromStripe(stripe.subscriptions.retrieve(subscriptionId))
		);
	}

	private client(): ResultAsync<Stripe, AppError> {
		if (!STRIPE_SECRET_KEY?.trim()) {
			return errAsync(configError(ERROR_CODE.CONFIG_MISSING, 'Missing STRIPE_SECRET_KEY'));
		}
		return okAsync(new Stripe(STRIPE_SECRET_KEY.trim()));
	}

	private fromStripe<T>(promise: Promise<T>): ResultAsync<T, AppError> {
		return RA.fromPromise(promise, (e) => ({
			kind: 'BACKEND' as const,
			code: ERROR_CODE.BILLING_STRIPE,
			status: 502,
			message: e instanceof Error ? e.message : 'Stripe request failed'
		}));
	}
}
