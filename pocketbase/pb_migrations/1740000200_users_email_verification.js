/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');

		users.authRule = 'verified = true';

		users.verificationTemplate.subject = 'Verify your SubREST email';
		users.verificationTemplate.body = [
			'<p>Hello,</p>',
			'<p>Thanks for signing up for SubREST. Confirm your email to activate your account:</p>',
			'<p><a class="btn" href="{APP_URL}/verify?token={TOKEN}" target="_blank" rel="noopener">Verify email</a></p>',
			'<p>Or copy this link into your browser:<br/><a href="{APP_URL}/verify?token={TOKEN}" target="_blank" rel="noopener">{APP_URL}/verify?token={TOKEN}</a></p>',
			"<p>If you didn't create an account, you can ignore this email.</p>"
		].join('\n');

		app.save(users);
	},
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.authRule = '';
		app.save(users);
	}
);
