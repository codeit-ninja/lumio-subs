import { createHash, randomBytes } from 'node:crypto';

/** Opaque API key shown once to the user. */
export function generateApiKey(): string {
	return `sk_${randomBytes(24).toString('base64url')}`;
}

export function hashApiKey(plaintext: string): string {
	return createHash('sha256').update(plaintext).digest('hex');
}

export function apiKeyPrefix(plaintext: string): string {
	return plaintext.slice(0, 8);
}
