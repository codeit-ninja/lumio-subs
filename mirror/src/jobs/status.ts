import { closePool, getPool } from '../db.ts';
import { createLogger } from '../logger.ts';

const log = createLogger('status');

async function main() {
	const counts = await getPool().query<{ status: string; n: string }>(
		`SELECT status, COUNT(*)::text AS n FROM subtitles GROUP BY status ORDER BY status`
	);

	const totalRes = await getPool().query<{ n: string }>(
		`SELECT COUNT(*)::text AS n FROM subtitles`
	);
	const total = Number(totalRes.rows[0]?.n ?? 0);

	const recent = await getPool().query<{ n: string }>(
		`
		SELECT COUNT(*)::text AS n
		FROM subtitles
		WHERE status = 'stored'
		  AND updated_at > NOW() - INTERVAL '5 minutes'
		`
	);
	const storedLast5Min = Number(recent.rows[0]?.n ?? 0);
	const ratePerSec = storedLast5Min / 300;

	const pendingRes = await getPool().query<{ n: string }>(
		`SELECT COUNT(*)::text AS n FROM subtitles WHERE status IN ('pending', 'failed')`
	);
	const remaining = Number(pendingRes.rows[0]?.n ?? 0);
	const etaSeconds = ratePerSec > 0 ? remaining / ratePerSec : null;

	const stats = await getPool().query<{
		stored_last_minute: number;
		failed_last_minute: number;
		window_started_at: Date;
	}>(
		`SELECT stored_last_minute, failed_last_minute, window_started_at FROM worker_stats WHERE id = 1`
	);

	const byStatus = Object.fromEntries(counts.rows.map((r) => [r.status, Number(r.n)]));

	const report = {
		total,
		byStatus,
		storedLast5Min,
		approxRatePerSec: Number(ratePerSec.toFixed(2)),
		remaining,
		etaHours: etaSeconds != null ? Number((etaSeconds / 3600).toFixed(1)) : null,
		workerWindow: stats.rows[0] ?? null
	};

	log.info(report, 'mirror status');
	console.log(JSON.stringify(report, null, 2));
	await closePool();
}

main().catch(async (err) => {
	log.error(err, 'status failed');
	await closePool();
	process.exit(1);
});
