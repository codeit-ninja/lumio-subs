import { error } from '@sveltejs/kit';

import { formatAppError } from '#lib/server/result.js';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const format = url.searchParams.get('format') === 'srt' ? 'srt' : 'vtt';
	const result = await locals.services.subtitles().getFile(params.id, format);
	if (result.isErr()) {
		const status = result.error.kind === 'config' ? 500 : (result.error.status ?? 500);
		error(status, formatAppError(result.error));
	}

	return new Response(result.value.body, {
		headers: {
			'Content-Type': result.value.contentType,
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
