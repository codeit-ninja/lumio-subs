import { redirect } from '@sveltejs/kit';
import { z } from 'zod';

import { formatAppError } from '#lib/server/result.js';
import { command, getRequestEvent } from '$app/server';

export const startCheckout = command(
	z.object({ planId: z.string().min(1) }),
	async ({ planId }) => {
		const { locals } = getRequestEvent();
		const user = locals.user;

		if (!user) {
			redirect(303, '/login');
		}

		const result = await locals.services.subscriptions().startCheckout(user, planId);

		if (result.isErr()) {
			return { ok: false as const, message: formatAppError(result.error) };
		}

		redirect(303, result.value.url);
	}
);

export const openBillingPortal = command(async () => {
	const { locals } = getRequestEvent();
	const user = locals.user;

	if (!user) {
		redirect(303, '/login');
	}

	const result = await locals.services.subscriptions().openBillingPortal(user);

	if (result.isErr()) {
		return { ok: false as const, message: formatAppError(result.error) };
	}

	redirect(303, result.value.url);
});
