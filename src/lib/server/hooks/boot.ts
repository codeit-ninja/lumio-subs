import type { Handle } from '@sveltejs/kit/hooks';
import PocketBase from 'pocketbase';

import type { AppUser } from '#lib/auth/user.js';
import { parseAppUser } from '#lib/auth/user.js';
import { PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD } from '$app/env/private';
import { PUBLIC_POCKETBASE_URL } from '$app/env/public';

import { Services } from '../services';

const PB_URL = PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8093';
const AUTH_COOKIE = 'pb_auth';

export const boot: Handle = async ({ event, resolve }) => {
	const adminPb = new PocketBase(PB_URL);

	if (PB_ADMIN_EMAIL?.trim() && PB_ADMIN_PASSWORD?.trim()) {
		try {
			await adminPb
				.collection('_superusers')
				.authWithPassword(PB_ADMIN_EMAIL.trim(), PB_ADMIN_PASSWORD.trim());
		} catch {
			// Admin auth optional at boot; cache writes will fail loudly later.
		}
	}

	const userPb = new PocketBase(PB_URL);
	userPb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	try {
		if (userPb.authStore.isValid) {
			await userPb.collection('users').authRefresh();
		}
	} catch {
		userPb.authStore.clear();
	}

	let user: AppUser | null = null;
	if (userPb.authStore.isValid && userPb.authStore.record) {
		user = parseAppUser(userPb.authStore.record);
	}

	event.locals.pocketbase = adminPb;
	event.locals.userPb = userPb;
	event.locals.user = user;
	event.locals.services = new Services();

	const response = await resolve(event);

	const secure = event.url.protocol === 'https:';
	response.headers.append(
		'set-cookie',
		userPb.authStore.exportToCookie(
			{
				httpOnly: true,
				secure,
				sameSite: 'lax',
				path: '/'
			},
			AUTH_COOKIE
		)
	);

	return response;
};
