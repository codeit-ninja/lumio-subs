import { z } from 'zod';

const configSchema = z.object({
	DATABASE_URL: z.string().min(1),
	OPENSUBTITLES_SCRAPER_URL: z.string().url().default('http://127.0.0.1:8000'),
	R2_ACCOUNT_ID: z.string().min(1),
	R2_ACCESS_KEY_ID: z.string().min(1),
	R2_SECRET_ACCESS_KEY: z.string().min(1),
	R2_BUCKET: z.string().min(1).default('opensubtitles-mirror'),
	R2_ENDPOINT: z.string().optional(),
	WORKER_RATE_PER_SECOND: z.coerce.number().positive().default(10),
	WORKER_BATCH_SIZE: z.coerce.number().int().positive().default(20),
	WORKER_MAX_RETRIES: z.coerce.number().int().nonnegative().default(5),
	WORKER_CONCURRENCY: z.coerce.number().int().positive().default(4),
	LOG_LEVEL: z.string().default('info')
});

export type Config = z.infer<typeof configSchema>;

let cached: Config | null = null;

export function loadConfig(partial = false): Config {
	if (cached && !partial) return cached;

	const parsed = configSchema.safeParse(process.env);
	if (!parsed.success) {
		const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
		throw new Error(`Invalid config: ${missing}`);
	}

	const cfg = {
		...parsed.data,
		OPENSUBTITLES_SCRAPER_URL: parsed.data.OPENSUBTITLES_SCRAPER_URL.replace(/\/+$/, ''),
		R2_ENDPOINT:
			parsed.data.R2_ENDPOINT?.trim() ||
			`https://${parsed.data.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
	};

	if (!partial) cached = cfg;
	return cfg;
}

/** Config needed only for metadata import / status (no R2). */
export function loadDbConfig(): { DATABASE_URL: string; LOG_LEVEL: string } {
	const DATABASE_URL = process.env.DATABASE_URL?.trim();
	if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
	return {
		DATABASE_URL,
		LOG_LEVEL: process.env.LOG_LEVEL?.trim() || 'info'
	};
}
