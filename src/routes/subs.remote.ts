import { formatAppError } from '#lib/server/result.js';
import { searchQuerySchema } from '#lib/subtitles/dto.js';
import { getRequestEvent, query } from '$app/server';

export const searchSubtitles = query(searchQuerySchema, async (input) => {
	const { locals } = getRequestEvent();
	const result = await locals.services.subtitles().search(input);
	if (result.isErr()) {
		throw new Error(formatAppError(result.error));
	}
	return result.value;
});

export const listSources = query(async () => {
	const { locals } = getRequestEvent();
	return locals.services.subtitles().sources();
});

export const providerStatus = query(async () => {
	const { locals } = getRequestEvent();
	return locals.services.subtitles().status();
});
