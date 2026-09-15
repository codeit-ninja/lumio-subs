import { gzipSync } from 'node:zlib';

import type { S3Client } from '@aws-sdk/client-s3';

import type { Config } from '../config.ts';
import { loadConfig } from '../config.ts';
import type { SubtitleRow } from '../db.ts';
import { closePool, getPool, waitForDatabase } from '../db.ts';
import { createLogger } from '../logger.ts';
import { LavxClient } from '../scraper/lavx.ts';
import {
	createR2Client,
	objectExists,
	publicUrlFor,
	putGzipObject,
	storageKeyFor
} from '../storage/r2.ts';

const log = createLogger('download-worker');

class RateLimiter {
	private timestamps: number[] = [];

	constructor(private readonly perSecond: number) {}

	async acquire(): Promise<void> {
		for (;;) {
			const now = Date.now();
			this.timestamps = this.timestamps.filter((t) => now - t < 1_000);
			if (this.timestamps.length < this.perSecond) {
				this.timestamps.push(now);
				return;
			}
			await Bun.sleep(25);
		}
	}
}

function scrapeUrl(row: SubtitleRow): string {
	return (
		row.source_url?.trim() ||
		row.download_url?.trim() ||
		`https://www.opensubtitles.org/en/subtitles/${row.external_id}`
	);
}

async function claimBatch(limit: number, maxRetries: number): Promise<SubtitleRow[]> {
	const result = await getPool().query<SubtitleRow>(
		`
		WITH picked AS (
			SELECT external_id
			FROM subtitles
			WHERE (
				status = 'pending'
				OR (status = 'failed' AND attempts < $1)
			)
			AND (lease_until IS NULL OR lease_until < NOW())
			ORDER BY external_id
			FOR UPDATE SKIP LOCKED
			LIMIT $2
		)
		UPDATE subtitles s
		SET
			attempts = s.attempts + 1,
			lease_until = NOW() + INTERVAL '10 minutes',
			updated_at = NOW(),
			error = NULL
		FROM picked
		WHERE s.external_id = picked.external_id
		RETURNING s.*
		`,
		[maxRetries, limit]
	);
	return result.rows;
}

async function markStored(
	externalId: string,
	storageKey: string,
	downloadUrl: string,
	bytesSize: number,
	fileName: string | null
): Promise<void> {
	await getPool().query(
		`
		UPDATE subtitles
		SET
			status = 'stored',
			storage_key = $2,
			download_url = $3,
			bytes_size = $4,
			file_name = COALESCE($5, file_name),
			lease_until = NULL,
			error = NULL,
			updated_at = NOW()
		WHERE external_id = $1
		`,
		[externalId, storageKey, downloadUrl, bytesSize, fileName]
	);
}

async function markFailed(externalId: string, error: string): Promise<void> {
	await getPool().query(
		`
		UPDATE subtitles
		SET
			status = 'failed',
			error = $2,
			lease_until = NULL,
			updated_at = NOW()
		WHERE external_id = $1
		`,
		[externalId, error.slice(0, 1000)]
	);
}

async function bumpStats(stored: number, failed: number): Promise<void> {
	await getPool().query(
		`
		UPDATE worker_stats
		SET
			stored_last_minute = CASE
				WHEN window_started_at < NOW() - INTERVAL '1 minute' THEN $1
				ELSE stored_last_minute + $1
			END,
			failed_last_minute = CASE
				WHEN window_started_at < NOW() - INTERVAL '1 minute' THEN $2
				ELSE failed_last_minute + $2
			END,
			window_started_at = CASE
				WHEN window_started_at < NOW() - INTERVAL '1 minute' THEN NOW()
				ELSE window_started_at
			END,
			updated_at = NOW()
		WHERE id = 1
		`,
		[stored, failed]
	);
}

async function processOne(
	row: SubtitleRow,
	lavx: LavxClient,
	r2: S3Client,
	cfg: Config,
	limiter: RateLimiter
): Promise<'stored' | 'failed' | 'skipped'> {
	const key = storageKeyFor(row.external_id);
	const r2Url = publicUrlFor(cfg.R2_PUBLIC_BASE_URL, key);

	try {
		if (await objectExists(r2, cfg.R2_BUCKET, key)) {
			await markStored(row.external_id, key, r2Url, row.bytes_size ?? 0, row.file_name);
			return 'skipped';
		}

		await limiter.acquire();
		const dl = await lavx.downloadSubtitle(row.external_id, scrapeUrl(row));
		const gzipped = gzipSync(Buffer.from(dl.bytes));
		await putGzipObject(r2, cfg.R2_BUCKET, key, new Uint8Array(gzipped));
		await markStored(row.external_id, key, r2Url, gzipped.byteLength, dl.filename || row.file_name);
		return 'stored';
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		await markFailed(row.external_id, message);
		log.warn({ externalId: row.external_id, err: message }, 'download failed');
		return 'failed';
	}
}

async function workerLoop(): Promise<void> {
	await waitForDatabase();
	const cfg = loadConfig();
	const lavx = new LavxClient(cfg.OPENSUBTITLES_SCRAPER_URL);
	const r2 = createR2Client(cfg);
	const limiter = new RateLimiter(cfg.WORKER_RATE_PER_SECOND);

	const health = await lavx.health();
	if (!health.ok) {
		log.warn(
			{ url: cfg.OPENSUBTITLES_SCRAPER_URL, detail: health.detail },
			'LavX health check failed — downloads will fail until the scraper is reachable on the same Docker network'
		);
	} else {
		log.info({ detail: health.detail }, 'LavX scraper reachable');
	}

	log.info(
		{
			rate: cfg.WORKER_RATE_PER_SECOND,
			concurrency: cfg.WORKER_CONCURRENCY,
			batch: cfg.WORKER_BATCH_SIZE,
			bucket: cfg.R2_BUCKET,
			publicBase: cfg.R2_PUBLIC_BASE_URL
		},
		'worker started'
	);

	for (;;) {
		const batch = await claimBatch(cfg.WORKER_BATCH_SIZE, cfg.WORKER_MAX_RETRIES);
		if (batch.length === 0) {
			log.info('queue empty; sleeping 30s');
			await Bun.sleep(30_000);
			continue;
		}

		let stored = 0;
		let failed = 0;
		let skipped = 0;

		const queue = [...batch];
		const runners = Array.from(
			{ length: Math.min(cfg.WORKER_CONCURRENCY, queue.length) },
			async () => {
				for (;;) {
					const row = queue.shift();
					if (!row) return;
					const result = await processOne(row, lavx, r2, cfg, limiter);
					if (result === 'stored') stored += 1;
					else if (result === 'failed') failed += 1;
					else skipped += 1;
				}
			}
		);

		await Promise.all(runners);
		await bumpStats(stored + skipped, failed);
		log.info({ claimed: batch.length, stored, failed, skipped }, 'batch complete');
	}
}

workerLoop().catch(async (err) => {
	log.error(err, 'worker crashed');
	await closePool();
	process.exit(1);
});
