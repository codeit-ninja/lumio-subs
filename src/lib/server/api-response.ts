import { json } from '@sveltejs/kit';

import type { AppError } from './result';
import { ERROR_CODE } from './result';

export type ApiErrorBody = {
	error: {
		code: string;
		message: string;
	};
};

/** Stable JSON error response for `/api/*` routes. */
export function apiError(
	error: AppError | { code: string; message: string },
	status?: number
): Response {
	const code = error.code;
	const message = error.message;
	const resolvedStatus =
		status ?? ('kind' in error ? (error.kind === 'config' ? 500 : (error.status ?? 500)) : 500);

	return json({ error: { code, message } } satisfies ApiErrorBody, { status: resolvedStatus });
}

export function apiValidationError(message: string): Response {
	return apiError({ code: ERROR_CODE.SEARCH_INVALID, message }, 400);
}

export function apiInternalError(message = 'Internal Error'): Response {
	return apiError({ code: ERROR_CODE.INTERNAL, message }, 500);
}
