import type { Handle } from '@sveltejs/kit/hooks';
import PocketBase from 'pocketbase';

import { PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD } from '$app/env/private';
import { PUBLIC_POCKETBASE_URL } from '$app/env/public';

import { Services } from '../services';

export const boot: Handle = async ({ event, resolve }) => {
	const pb = new PocketBase(PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8093');

	if (PB_ADMIN_EMAIL?.trim() && PB_ADMIN_PASSWORD?.trim()) {
		try {
			await pb
				.collection('_superusers')
				.authWithPassword(PB_ADMIN_EMAIL.trim(), PB_ADMIN_PASSWORD.trim());
		} catch {
			// Admin auth optional at boot; cache writes will fail loudly later.
		}
	}

	event.locals.pocketbase = pb;
	event.locals.services = new Services();

	return await resolve(event);
};
