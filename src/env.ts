import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_POCKETBASE_URL: { public: true, schema: (input) => input ?? 'http://127.0.0.1:8093' },
	TMDB_API_KEY: { schema: (input) => input ?? '' },
	OPENSUBTITLES_SCRAPER_URL: { schema: (input) => input ?? 'http://127.0.0.1:8000' },
	SUBDL_API_KEY: { schema: (input) => input ?? '' },
	PB_ADMIN_EMAIL: { schema: (input) => input ?? '' },
	PB_ADMIN_PASSWORD: { schema: (input) => input ?? '' },
	/** Public R2 base used to build direct file URLs (PB stores objects in this bucket). */
	CLOUDFLARE_R2_ENDPOINT: { schema: (input) => input ?? '' },
	CLOUDFLARE_R2_BUCKET: { schema: (input) => input ?? '' },
	SMTP_HOST: { schema: (input) => input ?? '' },
	SMTP_PORT: { schema: (input) => input ?? '465' },
	SMTP_USER: { schema: (input) => input ?? '' },
	SMTP_PASSWORD: { schema: (input) => input ?? '' },
	SMTP_FROM: { schema: (input) => input ?? '' },
	AUTH_VERIFICATION_SECRET: { schema: (input) => input ?? '' },
	STRIPE_SECRET_KEY: { schema: (input) => input ?? '' },
	STRIPE_WEBHOOK_SECRET: { schema: (input) => input ?? '' }
});
