import type { Result, ResultAsync } from 'neverthrow';
import { errAsync, ok } from 'neverthrow';

import type { AppUser } from '#lib/auth/user.js';
import { parseAppUser } from '#lib/auth/user.js';

import { createVerificationToken, parseVerificationToken } from './auth-verification';
import { Service } from './base.service';
import type { AppError } from './result';
import { ERROR_CODE, fromPb, panic } from './result';

export type LoginInput = {
	email: string;
	password: string;
};

export type RegisterInput = {
	email: string;
	password: string;
	passwordConfirm: string;
	name?: string;
};

export class AuthService extends Service {
	protected get userPb() {
		return this.ctx.locals.userPb;
	}

	currentUser(): Result<AppUser | null, AppError> {
		const record = this.ctx.locals.user;
		if (!record) {
			return ok(null);
		}

		const user = parseAppUser(record);
		if (!user) {
			return panic(ERROR_CODE.AUTH_INVALID_USER, 500, 'Invalid authenticated user record');
		}

		return ok(user);
	}

	login(input: LoginInput): ResultAsync<AppUser, AppError> {
		return fromPb(this.userPb.collection('users').authWithPassword(input.email, input.password))
			.mapErr((error) => mapAuthError(error, ERROR_CODE.AUTH_LOGIN_FAILED, 'Login failed'))
			.andThen((auth) => {
				const user = parseAppUser(auth.record);
				if (!user) {
					this.userPb.authStore.clear();
					return panic(ERROR_CODE.AUTH_INVALID_USER, 500, 'Invalid authenticated user record');
				}

				this.ctx.locals.user = user;
				return ok(user);
			});
	}

	register(input: RegisterInput): ResultAsync<void, AppError> {
		const email = input.email.trim().toLowerCase();
		const name = input.name?.trim() || '';

		return fromPb(
			this.userPb.collection('users').create({
				email,
				password: input.password,
				passwordConfirm: input.passwordConfirm,
				name
			})
		)
			.mapErr((error) =>
				mapAuthError(error, ERROR_CODE.AUTH_REGISTER_FAILED, 'Registration failed')
			)
			.andThen((record) =>
				this.ctx.locals.services
					.subscriptions()
					.assignFreePlan(record.id)
					.mapErr((error) =>
						mapAuthError(error, ERROR_CODE.AUTH_REGISTER_FAILED, 'Registration failed')
					)
					.andThen(() => this.sendVerificationForUser(record.id, email, name))
			);
	}

	logout(): Result<void, AppError> {
		this.userPb.authStore.clear();
		this.ctx.locals.user = null;
		return ok(undefined);
	}

	confirmVerification(token: string): ResultAsync<void, AppError> {
		const payload = parseVerificationToken(token);
		if (!payload) {
			return errAsync({
				kind: 'BACKEND',
				code: ERROR_CODE.AUTH_VERIFICATION_FAILED,
				status: 400,
				message: 'Invalid or expired verification link'
			});
		}

		return fromPb(
			this.pocketbase.collection('users').update(payload.userId, {
				verified: true
			})
		)
			.mapErr((error) =>
				mapAuthError(error, ERROR_CODE.AUTH_VERIFICATION_FAILED, 'Email verification failed')
			)
			.map(() => undefined);
	}

	requestVerification(email: string): ResultAsync<void, AppError> {
		const normalized = email.trim().toLowerCase();

		return fromPb(
			this.pocketbase
				.collection('users')
				.getFirstListItem(this.pocketbase.filter('email = {:email}', { email: normalized }))
		)
			.mapErr((error) =>
				mapAuthError(
					error,
					ERROR_CODE.AUTH_VERIFICATION_REQUEST_FAILED,
					'Could not send verification email'
				)
			)
			.andThen((record) => {
				if (record.verified) {
					return ok(undefined);
				}

				const name = typeof record.name === 'string' ? record.name : '';
				return this.sendVerificationForUser(record.id, normalized, name);
			});
	}

	private sendVerificationForUser(
		userId: string,
		email: string,
		name: string
	): ResultAsync<void, AppError> {
		let token: string;
		try {
			token = createVerificationToken({ userId, email });
		} catch (e) {
			return errAsync({
				kind: 'config',
				code: ERROR_CODE.CONFIG_MISSING,
				message: e instanceof Error ? e.message : 'Missing AUTH_VERIFICATION_SECRET'
			});
		}

		const verifyUrl = `${this.ctx.url.origin}/verify?token=${encodeURIComponent(token)}`;

		return this.ctx.locals.services
			.mail()
			.sendVerificationEmail({ to: email, name, verifyUrl })
			.mapErr((error) =>
				mapAuthError(
					error,
					ERROR_CODE.AUTH_VERIFICATION_REQUEST_FAILED,
					'Account created but verification email could not be sent'
				)
			);
	}
}

function mapAuthError(error: AppError, fallbackCode: string, fallbackMessage: string): AppError {
	if (error.kind === 'config') {
		return error;
	}

	if (error.kind === 'http') {
		return {
			kind: 'BACKEND',
			code: fallbackCode,
			status: error.status || 502,
			message: error.message || fallbackMessage
		};
	}

	const message = error.message.toLowerCase();
	if (error.status === 400 && (message.includes('verified') || message.includes('only verified'))) {
		return {
			kind: 'BACKEND',
			code: ERROR_CODE.AUTH_UNVERIFIED,
			status: 403,
			message: 'Please verify your email before signing in'
		};
	}

	return {
		kind: 'BACKEND',
		code: fallbackCode,
		status: error.status || 400,
		message: error.message || fallbackMessage
	};
}
