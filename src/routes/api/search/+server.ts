import { apiError, apiValidationError } from '#lib/server/api-response.js';
import { searchQuerySchema } from '#lib/subtitles/dto.js';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const parsed = searchQuerySchema.safeParse({
		imdb: url.searchParams.get('imdb') ?? undefined,
		tmdb: url.searchParams.get('tmdb') ?? undefined,
		s: url.searchParams.get('s') ?? undefined,
		e: url.searchParams.get('e') ?? undefined,
		lang: url.searchParams.get('lang') ?? undefined,
		type: url.searchParams.get('type') ?? undefined
	});

	if (!parsed.success) {
		return apiValidationError(parsed.error.issues[0]?.message ?? 'Invalid query');
	}

	const result = await locals.services.subtitles().search(parsed.data);
	if (result.isErr()) {
		return apiError(result.error);
	}

	return Response.json({ results: result.value });
};
