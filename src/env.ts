import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_POCKETBASE_URL: { public: true, schema: (input) => input ?? 'http://127.0.0.1:8093' },
	TMDB_API_KEY: { schema: (input) => input ?? '' },
	OPENSUBTITLES_SCRAPER_URL: { schema: (input) => input ?? 'http://127.0.0.1:8000' },
	SUBDL_API_KEY: { schema: (input) => input ?? '' },
	PB_ADMIN_EMAIL: { schema: (input) => input ?? '' },
	PB_ADMIN_PASSWORD: { schema: (input) => input ?? '' }
});
