import { redirect } from '@sveltejs/kit';

import { apiError } from '#lib/server/api-response.js';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const format = url.searchParams.get('format') === 'srt' ? 'srt' : 'vtt';
	const result = await locals.services.subtitles().getFile(params.id, format);
	if (result.isErr()) {
		return apiError(result.error);
	}

	const value = result.value;
	if (value.kind === 'redirect') {
		redirect(302, value.url);
	}

	return new Response(value.body, {
		headers: {
			'Content-Type': value.contentType,
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
