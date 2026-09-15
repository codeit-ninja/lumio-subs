import { apiError } from '#lib/server/api-response.js';
import { ERROR_CODE } from '#lib/server/result.js';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const signature = request.headers.get('stripe-signature');
	if (!signature) {
		return apiError(
			{ code: ERROR_CODE.BILLING_WEBHOOK, message: 'Missing stripe-signature header' },
			400
		);
	}

	const rawBody = await request.text();
	const stripe = locals.services.stripe();
	const eventResult = await stripe.constructEvent(rawBody, signature);

	if (eventResult.isErr()) {
		return apiError(eventResult.error);
	}

	const handled = await locals.services.subscriptions().handleStripeEvent(eventResult.value);
	if (handled.isErr()) {
		return apiError(handled.error);
	}

	return new Response(JSON.stringify({ received: true }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
};
