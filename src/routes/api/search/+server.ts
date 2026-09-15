import { error, json } from '@sveltejs/kit';

import { formatAppError } from '#lib/server/result.js';
import { searchQuerySchema } from '#lib/subtitles/dto.js';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const parsed = searchQuerySchema.safeParse({
		imdb: url.searchParams.get('imdb') ?? undefined,
		tmdb: url.searchParams.get('tmdb') ?? undefined,
		s: url.searchParams.get('s') ?? undefined,
		e: url.searchParams.get('e') ?? undefined,
		lang: url.searchParams.get('lang') ?? undefined,
		sources: url.searchParams.get('sources') ?? undefined,
		refresh: url.searchParams.get('refresh') ?? undefined,
		type: url.searchParams.get('type') ?? undefined
	});

	if (!parsed.success) {
		error(400, parsed.error.issues[0]?.message ?? 'Invalid query');
	}

	const result = await locals.services.subtitles().search(parsed.data);
	if (result.isErr()) {
		const status = result.error.kind === 'config' ? 500 : (result.error.status ?? 500);
		error(status, formatAppError(result.error));
	}

	return json({ results: result.value });
};
