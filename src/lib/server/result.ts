import type { Result } from 'neverthrow';
import { err, errAsync, okAsync, ResultAsync } from 'neverthrow';
import { ClientResponseError } from 'pocketbase';

/** Stable, grep-able codes for every server/backend error site. */
export const ERROR_CODE = {
	PB_RESPONSE: 'PB_RESPONSE',
	PB_UNKNOWN: 'PB_UNKNOWN',
	HTTP_NETWORK: 'HTTP_NETWORK',
	HTTP_STATUS: 'HTTP_STATUS',
	HTTP_BODY_READ: 'HTTP_BODY_READ',
	HTTP_JSON: 'HTTP_JSON',
	CONFIG_MISSING: 'CONFIG_MISSING',
	TMDB_API: 'TMDB_API',
	TMDB_NOT_FOUND: 'TMDB_NOT_FOUND',
	PROVIDER_TIMEOUT: 'PROVIDER_TIMEOUT',
	PROVIDER_ERROR: 'PROVIDER_ERROR',
	PROVIDER_PARSE: 'PROVIDER_PARSE',
	SEARCH_INVALID: 'SEARCH_INVALID',
	INTERNAL: 'INTERNAL',
	SUBTITLE_NOT_FOUND: 'SUBTITLE_NOT_FOUND',
	SUBTITLE_CACHE: 'SUBTITLE_CACHE',
	SUBTITLE_CONVERT: 'SUBTITLE_CONVERT',
	OPENSUBTITLES_SCRAPER: 'OPENSUBTITLES_SCRAPER',
	SUBDL_API: 'SUBDL_API',
	PODNAPISI_API: 'PODNAPISI_API',
	GESTOWN_API: 'GESTOWN_API',
	SCRAPE_FAILED: 'SCRAPE_FAILED',
	AUTH_INVALID_USER: 'AUTH_INVALID_USER',
	AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
	AUTH_REGISTER_FAILED: 'AUTH_REGISTER_FAILED',
	AUTH_UNVERIFIED: 'AUTH_UNVERIFIED',
	AUTH_VERIFICATION_FAILED: 'AUTH_VERIFICATION_FAILED',
	AUTH_VERIFICATION_REQUEST_FAILED: 'AUTH_VERIFICATION_REQUEST_FAILED',
	AUTH_REQUIRED: 'AUTH_REQUIRED',
	SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
	RATE_LIMITED: 'RATE_LIMITED',
	API_KEY_INVALID: 'API_KEY_INVALID',
	API_KEY_NOT_FOUND: 'API_KEY_NOT_FOUND',
	BILLING_PLAN_NOT_FOUND: 'BILLING_PLAN_NOT_FOUND',
	BILLING_STRIPE: 'BILLING_STRIPE',
	BILLING_WEBHOOK: 'BILLING_WEBHOOK',
	BILLING_NO_CUSTOMER: 'BILLING_NO_CUSTOMER',
	BILLING_CHECKOUT_UNAVAILABLE: 'BILLING_CHECKOUT_UNAVAILABLE',
	MAIL_RENDER: 'MAIL_RENDER',
	MAIL_SEND: 'MAIL_SEND'
} as const;

export type ERROR_CODE = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

/** Domain error from PocketBase, HTTP APIs, or missing config. Always includes a unique `code`. */
export type AppError =
	| { kind: 'BACKEND'; code: string; status: number; message: string }
	| { kind: 'http'; code: string; status: number; message: string }
	| { kind: 'config'; code: string; message: string };

function backendFailure(
	code: string,
	status: number,
	message: string
): Extract<AppError, { kind: 'BACKEND' }> {
	return { kind: 'BACKEND', code, status, message };
}

/** Fail with a BACKEND AppError — use as `return panic(...)`. */
export function panic(code: string, status: number, message: string): Result<never, AppError> {
	return err(backendFailure(code, status, message));
}

export function httpError(
	code: string,
	status: number,
	message: string
): Extract<AppError, { kind: 'http' }> {
	return { kind: 'http', code, status, message };
}

export function configError(code: string, message: string): Extract<AppError, { kind: 'config' }> {
	return { kind: 'config', code, message };
}

/** Client-facing string that always includes the traceable code. */
export function formatAppError(error: AppError): string {
	return `[${error.code}] ${error.message}`;
}

/** Wrap a PocketBase promise as ResultAsync with typed AppError. */
export function fromPb<T>(p: Promise<T>): ResultAsync<T, AppError> {
	return ResultAsync.fromPromise(p, (e) => {
		if (e instanceof ClientResponseError) {
			const details = formatPbValidation(e);
			return backendFailure(
				ERROR_CODE.PB_RESPONSE,
				e.status,
				details ? `${e.message} (${details})` : e.message
			);
		}

		return backendFailure(ERROR_CODE.PB_UNKNOWN, 500, 'Unknown error');
	});
}

function formatPbValidation(e: ClientResponseError): string | null {
	const data = e.data ?? e.response;
	if (!data || typeof data !== 'object') return null;
	const fields = 'data' in data && data.data && typeof data.data === 'object' ? data.data : data;
	const parts: string[] = [];
	for (const [key, value] of Object.entries(fields as Record<string, unknown>)) {
		if (!value || typeof value !== 'object') continue;
		const message = 'message' in value ? String((value as { message?: unknown }).message) : null;
		if (message) parts.push(`${key}: ${message}`);
	}
	return parts.length ? parts.join('; ') : null;
}

/** Wrap a fetch call as ResultAsync: non-OK → http error, JSON body on success. */
export function fromHttp<T>(url: string | URL, init?: RequestInit): ResultAsync<T, AppError> {
	return ResultAsync.fromPromise(fetch(url, init), (e) =>
		httpError(
			ERROR_CODE.HTTP_NETWORK,
			500,
			e instanceof Error ? e.message : 'Network request failed'
		)
	).andThen((response) => {
		if (!response.ok) {
			return ResultAsync.fromPromise(response.text(), () =>
				httpError(
					ERROR_CODE.HTTP_BODY_READ,
					response.status,
					response.statusText || `HTTP ${response.status}`
				)
			).andThen((body) =>
				errAsync(
					httpError(
						ERROR_CODE.HTTP_STATUS,
						response.status,
						body || response.statusText || `HTTP ${response.status}`
					)
				)
			);
		}

		return ResultAsync.fromPromise(response.json() as Promise<T>, (e) =>
			httpError(
				ERROR_CODE.HTTP_JSON,
				500,
				e instanceof Error ? e.message : 'Failed to parse JSON response'
			)
		);
	});
}

/** Fetch raw bytes; non-OK → http error. */
export function fromHttpBytes(
	url: string | URL,
	init?: RequestInit
): ResultAsync<Uint8Array, AppError> {
	return ResultAsync.fromPromise(fetch(url, init), (e) =>
		httpError(
			ERROR_CODE.HTTP_NETWORK,
			500,
			e instanceof Error ? e.message : 'Network request failed'
		)
	).andThen((response) => {
		if (!response.ok) {
			return errAsync(
				httpError(
					ERROR_CODE.HTTP_STATUS,
					response.status,
					response.statusText || `HTTP ${response.status}`
				)
			);
		}

		return ResultAsync.fromPromise(response.arrayBuffer(), (e) =>
			httpError(
				ERROR_CODE.HTTP_BODY_READ,
				500,
				e instanceof Error ? e.message : 'Failed to read response body'
			)
		).map((buf) => new Uint8Array(buf));
	});
}

/** Fail early when a required API key / client id is missing. */
export function requireConfig(
	value: string | undefined,
	name: string
): ResultAsync<string, AppError> {
	if (!value) {
		return errAsync(
			configError(ERROR_CODE.CONFIG_MISSING, `Missing environment variable: ${name}`)
		);
	}

	return okAsync(value);
}

/** Reject when `promise` does not settle within `ms`. */
export function promiseWithTimeout<T>(
	promise: Promise<T>,
	ms: number,
	message: string
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(message)), ms);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error: unknown) => {
				clearTimeout(timer);
				reject(error);
			}
		);
	});
}
