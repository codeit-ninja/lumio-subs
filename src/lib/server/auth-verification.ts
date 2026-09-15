import { createHmac, timingSafeEqual } from 'node:crypto';

import { AUTH_VERIFICATION_SECRET } from '$app/env/private';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type VerificationPayload = {
	userId: string;
	email: string;
	exp: number;
};

function requireSecret(): string {
	const secret = AUTH_VERIFICATION_SECRET?.trim();
	if (!secret) {
		throw new Error('Missing AUTH_VERIFICATION_SECRET');
	}
	return secret;
}

function b64url(input: Buffer | string): string {
	const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
	return buf.toString('base64url');
}

function sign(body: string): string {
	return createHmac('sha256', requireSecret()).update(body).digest('base64url');
}

export function createVerificationToken(input: {
	userId: string;
	email: string;
	ttlMs?: number;
}): string {
	const payload: VerificationPayload = {
		userId: input.userId,
		email: input.email.trim().toLowerCase(),
		exp: Date.now() + (input.ttlMs ?? TOKEN_TTL_MS)
	};
	const body = b64url(JSON.stringify(payload));
	return `${body}.${sign(body)}`;
}

export function parseVerificationToken(token: string): VerificationPayload | null {
	const [body, signature] = token.split('.');
	if (!body || !signature) return null;

	const expected = sign(body);
	const a = Buffer.from(signature);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) {
		return null;
	}

	try {
		const raw = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as VerificationPayload;
		if (!raw?.userId || !raw?.email || typeof raw.exp !== 'number') return null;
		if (raw.exp < Date.now()) return null;
		return raw;
	} catch {
		return null;
	}
}
