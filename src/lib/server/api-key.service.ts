import type { ResultAsync } from 'neverthrow';
import { errAsync, okAsync } from 'neverthrow';
import type { ListResult, RecordModel } from 'pocketbase';

import type { AppUser } from '#lib/auth/user.js';
import { parseAppUser } from '#lib/auth/user.js';
import type { ApiKeyPublic } from '#lib/billing/plan.js';
import { parseApiKeyPublic } from '#lib/billing/plan.js';

import { apiKeyPrefix, generateApiKey, hashApiKey } from './api-key';
import { Service } from './base.service';
import type { AppError } from './result';
import { ERROR_CODE, fromPb } from './result';

export type CreateApiKeyInput = {
	userId: string;
	name: string;
	expiresAt?: string | null;
};

export type CreatedApiKey = ApiKeyPublic & {
	key: string;
};

export class ApiKeyService extends Service {
	listForUser(userId: string): ResultAsync<ApiKeyPublic[], AppError> {
		return fromPb<ListResult<RecordModel>>(
			this.pocketbase.collection('api_keys').getList(1, 100, {
				filter: this.pocketbase.filter('user = {:userId}', { userId }),
				sort: '-created'
			})
		).map((result) =>
			result.items
				.map((item) =>
					parseApiKeyPublic({
						id: item.id,
						name: item.name,
						keyPrefix: item.keyPrefix,
						expiresAt: item.expiresAt,
						revokedAt: item.revokedAt,
						lastUsedAt: item.lastUsedAt,
						created: item.created
					})
				)
				.filter((key): key is ApiKeyPublic => key !== null)
		);
	}

	create(input: CreateApiKeyInput): ResultAsync<CreatedApiKey, AppError> {
		const name = input.name.trim();
		if (!name) {
			return errAsync({
				kind: 'BACKEND',
				code: ERROR_CODE.API_KEY_INVALID,
				status: 400,
				message: 'Name is required'
			});
		}

		const key = generateApiKey();
		const payload: Record<string, unknown> = {
			user: input.userId,
			name,
			keyPrefix: apiKeyPrefix(key),
			keyHash: hashApiKey(key)
		};

		if (input.expiresAt) {
			payload.expiresAt = input.expiresAt;
		}

		return fromPb<RecordModel>(this.pocketbase.collection('api_keys').create(payload)).andThen(
			(record) => {
				const publicKey = parseApiKeyPublic({
					id: record.id,
					name: record.name,
					keyPrefix: record.keyPrefix,
					expiresAt: record.expiresAt,
					revokedAt: record.revokedAt,
					lastUsedAt: record.lastUsedAt,
					created: record.created
				});
				if (!publicKey) {
					return errAsync({
						kind: 'BACKEND' as const,
						code: ERROR_CODE.API_KEY_INVALID,
						status: 500,
						message: 'Created API key record was invalid'
					});
				}
				return okAsync({ ...publicKey, key });
			}
		);
	}

	revoke(userId: string, keyId: string): ResultAsync<void, AppError> {
		return fromPb<RecordModel>(this.pocketbase.collection('api_keys').getOne(keyId)).andThen(
			(record) => {
				if (record.user !== userId) {
					return errAsync({
						kind: 'BACKEND' as const,
						code: ERROR_CODE.API_KEY_NOT_FOUND,
						status: 404,
						message: 'API key not found'
					});
				}
				if (record.revokedAt) {
					return okAsync(undefined);
				}
				return fromPb(
					this.pocketbase.collection('api_keys').update(keyId, {
						revokedAt: new Date().toISOString()
					})
				).map(() => undefined);
			}
		);
	}

	findValidByPlaintext(plaintext: string): ResultAsync<AppUser | null, AppError> {
		const normalized = plaintext.trim();
		if (!normalized) return okAsync(null);

		const keyHash = hashApiKey(normalized);

		return fromPb<RecordModel>(
			this.pocketbase
				.collection('api_keys')
				.getFirstListItem(this.pocketbase.filter('keyHash = {:keyHash}', { keyHash }))
		)
			.andThen((record) => {
				if (record.revokedAt) {
					return okAsync(null);
				}

				if (record.expiresAt) {
					const expires = new Date(String(record.expiresAt));
					if (!Number.isNaN(expires.getTime()) && expires.getTime() <= Date.now()) {
						return okAsync(null);
					}
				}

				const userId = String(record.user);
				return fromPb<RecordModel>(this.pocketbase.collection('users').getOne(userId))
					.map((userRecord) => parseAppUser(userRecord))
					.andThen((user) => {
						if (!user) return okAsync(null);
						// Fire-and-forget lastUsedAt; ignore failures
						void this.pocketbase
							.collection('api_keys')
							.update(record.id, { lastUsedAt: new Date().toISOString() })
							.catch(() => undefined);
						return okAsync(user);
					});
			})
			.orElse((error) => {
				if (error.kind === 'BACKEND' && error.status === 404) {
					return okAsync(null);
				}
				return errAsync(error);
			});
	}
}
