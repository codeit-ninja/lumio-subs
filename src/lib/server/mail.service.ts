import { Renderer, toPlainText } from '@better-svelte-email/server';
import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import nodemailer from 'nodemailer';

import VerifyEmail from '#lib/emails/verify-email.svelte';
import { SMTP_FROM, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER } from '$app/env/private';

import { Service } from './base.service';
import type { AppError } from './result';
import { configError, ERROR_CODE, httpError, requireConfig } from './result';

const renderer = new Renderer();

export type SendVerificationEmailInput = {
	to: string;
	name?: string | null;
	verifyUrl: string;
};

export class MailService extends Service {
	isConfigured(): boolean {
		return Boolean(
			SMTP_HOST?.trim() && SMTP_USER?.trim() && SMTP_PASSWORD?.trim() && SMTP_FROM?.trim()
		);
	}

	sendVerificationEmail(input: SendVerificationEmailInput): ResultAsync<void, AppError> {
		return this.requireSmtp().andThen((smtp) =>
			ResultAsync.fromPromise(
				renderer.render(VerifyEmail, {
					props: {
						name: input.name ?? null,
						verifyUrl: input.verifyUrl
					}
				}),
				(e) =>
					httpError(
						ERROR_CODE.MAIL_RENDER,
						500,
						e instanceof Error ? e.message : 'Failed to render verification email'
					)
			).andThen((html) => {
				const text = toPlainText(html);
				const transporter = nodemailer.createTransport({
					host: smtp.host,
					port: smtp.port,
					secure: smtp.port === 465,
					auth: {
						user: smtp.user,
						pass: smtp.password
					}
				});

				return ResultAsync.fromPromise(
					transporter.sendMail({
						from: smtp.from,
						to: input.to,
						subject: 'Verify your SubREST email',
						html,
						text
					}),
					(e) =>
						httpError(
							ERROR_CODE.MAIL_SEND,
							502,
							e instanceof Error ? e.message : 'Failed to send verification email'
						)
				).map(() => undefined);
			})
		);
	}

	private requireSmtp(): ResultAsync<
		{ host: string; port: number; user: string; password: string; from: string },
		AppError
	> {
		return requireConfig(SMTP_HOST?.trim(), 'SMTP_HOST')
			.andThen((host) =>
				requireConfig(SMTP_USER?.trim(), 'SMTP_USER').map((user) => ({ host, user }))
			)
			.andThen(({ host, user }) =>
				requireConfig(SMTP_PASSWORD?.trim(), 'SMTP_PASSWORD').map((password) => ({
					host,
					user,
					password
				}))
			)
			.andThen(({ host, user, password }) =>
				requireConfig(SMTP_FROM?.trim(), 'SMTP_FROM').map((from) => ({
					host,
					user,
					password,
					from,
					port: Number(SMTP_PORT?.trim() || '465') || 465
				}))
			)
			.andThen((cfg) => {
				if (!Number.isFinite(cfg.port) || cfg.port <= 0) {
					return errAsync(configError(ERROR_CODE.CONFIG_MISSING, 'Invalid SMTP_PORT'));
				}
				return okAsync(cfg);
			});
	}
}
