import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { sequence } from '@sveltejs/kit/hooks';

import { apiError, apiInternalError } from '#lib/server/api-response.js';
import { ERROR_CODE } from '#lib/server/result.js';

import { boot } from './lib/server/hooks/boot';
import { requireSubscription } from './lib/server/hooks/require-subscription';

/**
 * Prefer JSON for `/api/*` and normalize SvelteKit/uncaught errors to
 * `{ error: { code, message } }`.
 */
const preferApiJson: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/api/')) {
		return resolve(event);
	}

	event.request.headers.set('accept', 'application/json');
	const response = await resolve(event);

	if (
		response.ok ||
		response.status === 301 ||
		response.status === 302 ||
		response.status === 303
	) {
		return response;
	}

	const contentType = response.headers.get('content-type') ?? '';
	if (!contentType.includes('application/json')) {
		return apiInternalError(response.statusText || 'Internal Error');
	}

	try {
		const body: unknown = await response.clone().json();
		if (
			body &&
			typeof body === 'object' &&
			'error' in body &&
			body.error &&
			typeof body.error === 'object' &&
			'code' in body.error &&
			'message' in body.error
		) {
			return response;
		}

		if (body && typeof body === 'object' && 'message' in body) {
			const message = String((body as { message: unknown }).message);
			const code =
				'code' in body && typeof (body as { code: unknown }).code === 'string'
					? (body as { code: string }).code
					: ERROR_CODE.INTERNAL;
			return apiError({ code, message }, response.status);
		}
	} catch {
		return apiInternalError('Internal Error');
	}

	return response;
};

export const handle = sequence(preferApiJson, boot, requireSubscription);

export const handleError: HandleServerError = ({ event, kind, error }) => {
	if (!event.url.pathname.startsWith('/api/')) {
		return;
	}

	if (kind === 'app') {
		return {
			message: error.message,
			code: error.code ?? ERROR_CODE.INTERNAL
		};
	}

	if (kind === 'framework' || kind === 'validation') {
		return {
			message: error.message,
			code: error.status >= 500 ? ERROR_CODE.INTERNAL : ERROR_CODE.SEARCH_INVALID
		};
	}

	return {
		message: 'Internal Error',
		code: ERROR_CODE.INTERNAL
	};
};
