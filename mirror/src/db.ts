import pg from 'pg';

import { loadDbConfig } from './config.ts';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
	if (pool) return pool;
	const { DATABASE_URL } = loadDbConfig();
	pool = new Pool({ connectionString: DATABASE_URL, max: 10 });
	return pool;
}

export async function closePool(): Promise<void> {
	if (!pool) return;
	await pool.end();
	pool = null;
}

export type SubtitleStatus = 'pending' | 'stored' | 'failed' | 'skipped';

export type SubtitleRow = {
	external_id: string;
	language: string;
	format: string;
	release: string | null;
	file_name: string | null;
	imdb_id: string | null;
	movie_name: string | null;
	movie_year: number | null;
	movie_kind: string | null;
	series_season: number | null;
	series_episode: number | null;
	source_url: string | null;
	download_url: string | null;
	storage_key: string | null;
	bytes_size: number | null;
	status: SubtitleStatus;
	error: string | null;
	attempts: number;
};

export async function waitForDatabase(opts?: {
	attempts?: number;
	delayMs?: number;
}): Promise<void> {
	const attempts = opts?.attempts ?? 60;
	const delayMs = opts?.delayMs ?? 2_000;
	const pool = getPool();

	for (let i = 1; i <= attempts; i++) {
		try {
			await pool.query('SELECT 1');
			return;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			if (i === attempts) {
				throw new Error(`Postgres not ready after ${attempts} attempts: ${message}`, {
					cause: err
				});
			}
			await Bun.sleep(delayMs);
		}
	}
}

export async function initSchema(sqlPath: string): Promise<void> {
	const sql = await Bun.file(sqlPath).text();
	await getPool().query(sql);
}
