import { z } from 'zod';

import { formatAppError } from '#lib/server/result.js';
import { command, getRequestEvent, query } from '$app/server';

export const listApiKeys = query(async () => {
	const { locals } = getRequestEvent();
	if (!locals.user) return [];

	const result = await locals.services.apiKeys().listForUser(locals.user.id);
	return result.unwrapOr([]);
});

export const createApiKey = command(
	z.object({
		name: z.string().min(1).max(120),
		expiresAt: z.string().min(1).optional().nullable()
	}),
	async ({ name, expiresAt }) => {
		const { locals } = getRequestEvent();
		if (!locals.user) {
			return { ok: false as const, message: 'Sign in to create an API key' };
		}

		let normalizedExpires: string | null = null;
		if (expiresAt) {
			const parsed = new Date(expiresAt);
			if (Number.isNaN(parsed.getTime())) {
				return { ok: false as const, message: 'Invalid expiry date' };
			}
			normalizedExpires = parsed.toISOString();
		}

		const result = await locals.services.apiKeys().create({
			userId: locals.user.id,
			name,
			expiresAt: normalizedExpires
		});

		if (result.isErr()) {
			return { ok: false as const, message: formatAppError(result.error) };
		}

		return { ok: true as const, key: result.value };
	}
);

export const revokeApiKey = command(z.object({ id: z.string().min(1) }), async ({ id }) => {
	const { locals } = getRequestEvent();
	if (!locals.user) {
		return { ok: false as const, message: 'Sign in to revoke an API key' };
	}

	const result = await locals.services.apiKeys().revoke(locals.user.id, id);
	if (result.isErr()) {
		return { ok: false as const, message: formatAppError(result.error) };
	}

	return { ok: true as const };
});
