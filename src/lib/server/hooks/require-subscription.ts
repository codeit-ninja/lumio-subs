import type { Handle } from '@sveltejs/kit/hooks';

import { apiError } from '#lib/server/api-response.js';
import { consumeRateLimit } from '#lib/server/rate-limit.js';
import { ERROR_CODE } from '#lib/server/result.js';

const PUBLIC_API_PREFIXES = ['/api/status', '/api/sources', '/api/stripe/webhook'];

function isGatedApiPath(pathname: string): boolean {
	if (!pathname.startsWith('/api/')) return false;
	return !PUBLIC_API_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	);
}

function extractApiKey(request: Request): string | null {
	const xApiKey = request.headers.get('x-api-key')?.trim();
	if (xApiKey) return xApiKey;

	const authorization = request.headers.get('authorization');
	if (!authorization) return null;

	const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
	return match?.[1]?.trim() || null;
}

/**
 * Resolve API-key auth when no session user, ensure free entitlement, then
 * enforce plan rate limits on gated `/api/*` routes.
 */
export const requireSubscription: Handle = async ({ event, resolve }) => {
	if (!event.locals.user) {
		const apiKey = extractApiKey(event.request);
		if (apiKey) {
			const userResult = await event.locals.services.apiKeys().findValidByPlaintext(apiKey);
			if (userResult.isOk() && userResult.value) {
				event.locals.user = userResult.value;
			}
		}
	}

	if (!isGatedApiPath(event.url.pathname)) {
		return resolve(event);
	}

	const user = event.locals.user;
	if (!user) {
		return apiError(
			{
				code: ERROR_CODE.AUTH_REQUIRED,
				message:
					'Authentication required. Create an API key and pass Authorization: Bearer <apiKey>, or sign in.'
			},
			401
		);
	}

	const entitlementResult = await event.locals.services
		.subscriptions()
		.ensureFreeSubscription(user.id);

	if (entitlementResult.isErr()) {
		return apiError(entitlementResult.error);
	}

	const { plan } = entitlementResult.value;
	const limited = consumeRateLimit(user.id, plan);
	if (!limited.ok) {
		const response = apiError({ code: limited.code, message: limited.message }, limited.status);
		response.headers.set('Retry-After', String(limited.retryAfterSeconds));
		return response;
	}

	return resolve(event);
};
