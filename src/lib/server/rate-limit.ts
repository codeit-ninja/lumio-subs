import type { Plan } from '#lib/billing/plan.js';

import { ERROR_CODE } from './result';

export type RateLimitResult =
	| { ok: true }
	| {
			ok: false;
			code: typeof ERROR_CODE.RATE_LIMITED;
			status: 429;
			message: string;
			retryAfterSeconds: number;
			window: 'second' | 'minute' | 'hour' | 'day' | 'month';
	  };

type WindowState = {
	hits: number[];
	dayKey: string;
	dayCount: number;
	monthKey: string;
	monthCount: number;
};

const buckets = new Map<string, WindowState>();

function dayKey(now: Date): string {
	return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
}

function monthKey(now: Date): string {
	return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
}

function getState(userId: string, now: Date): WindowState {
	let state = buckets.get(userId);
	if (!state) {
		state = {
			hits: [],
			dayKey: dayKey(now),
			dayCount: 0,
			monthKey: monthKey(now),
			monthCount: 0
		};
		buckets.set(userId, state);
	}

	const dKey = dayKey(now);
	if (state.dayKey !== dKey) {
		state.dayKey = dKey;
		state.dayCount = 0;
	}

	const mKey = monthKey(now);
	if (state.monthKey !== mKey) {
		state.monthKey = mKey;
		state.monthCount = 0;
	}

	return state;
}

function countInWindow(hits: number[], nowMs: number, windowMs: number): number {
	const start = nowMs - windowMs;
	let i = 0;
	while (i < hits.length && hits[i]! < start) i += 1;
	if (i > 0) hits.splice(0, i);
	return hits.length;
}

function limited(
	window: 'second' | 'minute' | 'hour' | 'day' | 'month',
	retryAfterSeconds: number,
	limit: number
): RateLimitResult {
	return {
		ok: false,
		code: ERROR_CODE.RATE_LIMITED,
		status: 429,
		message: `Rate limit exceeded (${window}: ${limit}). Try again later.`,
		retryAfterSeconds,
		window
	};
}

/**
 * In-process fixed/sliding windows per user. Fine for single-node Bun.
 */
export function consumeRateLimit(userId: string, plan: Plan): RateLimitResult {
	const now = new Date();
	const nowMs = now.getTime();
	const state = getState(userId, now);

	const secondCount = countInWindow(state.hits, nowMs, 1_000);
	if (secondCount >= plan.limitPerSecond) {
		return limited('second', 1, plan.limitPerSecond);
	}

	const minuteCount = countInWindow(state.hits, nowMs, 60_000);
	if (minuteCount >= plan.limitPerMinute) {
		return limited('minute', 60, plan.limitPerMinute);
	}

	const hourCount = countInWindow(state.hits, nowMs, 3_600_000);
	if (hourCount >= plan.limitPerHour) {
		return limited('hour', 3600, plan.limitPerHour);
	}

	if (state.dayCount >= plan.limitPerDay) {
		const endOfDay = Date.UTC(
			now.getUTCFullYear(),
			now.getUTCMonth(),
			now.getUTCDate() + 1,
			0,
			0,
			0
		);
		const retryAfterSeconds = Math.max(1, Math.ceil((endOfDay - nowMs) / 1000));
		return limited('day', retryAfterSeconds, plan.limitPerDay);
	}

	if (state.monthCount >= plan.limitPerMonth) {
		const endOfMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0);
		const retryAfterSeconds = Math.max(1, Math.ceil((endOfMonth - nowMs) / 1000));
		return limited('month', retryAfterSeconds, plan.limitPerMonth);
	}

	state.hits.push(nowMs);
	state.dayCount += 1;
	state.monthCount += 1;
	return { ok: true };
}
