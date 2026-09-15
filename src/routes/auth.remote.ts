import { invalid, redirect } from '@sveltejs/kit';
import { z } from 'zod';

import { formatAppError } from '#lib/server/result.js';
import { command, form, getRequestEvent, query } from '$app/server';

const credentialsSchema = z.object({
	email: z.email('Enter a valid email'),
	password: z.string().min(8, 'Password must be at least 8 characters')
});

const registerSchema = credentialsSchema
	.extend({
		passwordConfirm: z.string().min(8, 'Confirm your password'),
		name: z.string().max(120).optional()
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: 'Passwords do not match',
		path: ['passwordConfirm']
	});

const verifySchema = z.object({
	token: z.string().min(1, 'Missing verification token')
});

export const currentUser = query(async () => {
	const { locals } = getRequestEvent();
	return locals.services
		.auth()
		.currentUser()
		.match(
			(user) => user,
			() => null
		);
});

export const login = form(credentialsSchema, async ({ email, password }) => {
	const { locals } = getRequestEvent();
	const result = await locals.services.auth().login({ email, password });

	if (result.isErr()) {
		invalid(formatAppError(result.error));
	}

	redirect(303, '/');
});

export const register = form(registerSchema, async (data) => {
	const { locals } = getRequestEvent();
	const result = await locals.services.auth().register({
		email: data.email,
		password: data.password,
		passwordConfirm: data.passwordConfirm,
		name: data.name
	});

	if (result.isErr()) {
		invalid(formatAppError(result.error));
	}

	return { ok: true as const, email: data.email };
});

export const logout = form(async () => {
	const { locals } = getRequestEvent();
	locals.services.auth().logout();
	redirect(303, '/');
});

export const confirmVerification = form(verifySchema, async ({ token }) => {
	const { locals } = getRequestEvent();
	const result = await locals.services.auth().confirmVerification(token);

	if (result.isErr()) {
		invalid(formatAppError(result.error));
	}

	return { ok: true as const };
});

export const resendVerification = command(z.object({ email: z.email() }), async ({ email }) => {
	const { locals } = getRequestEvent();
	const result = await locals.services.auth().requestVerification(email);

	if (result.isErr()) {
		return { ok: false as const, message: formatAppError(result.error) };
	}

	return { ok: true as const };
});
