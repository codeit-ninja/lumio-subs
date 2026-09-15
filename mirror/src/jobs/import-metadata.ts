import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { createGunzip } from 'node:zlib';

import { closePool, getPool } from '../db.ts';
import { resolveDumpPath } from '../download-dump.ts';
import { createLogger } from '../logger.ts';

const log = createLogger('import-metadata');

const EXPECTED_COLS = [
	'IDSubtitle',
	'MovieName',
	'MovieYear',
	'LanguageName',
	'ISO639',
	'SubAddDate',
	'ImdbID',
	'SubFormat',
	'SubSumCD',
	'MovieReleaseName',
	'MovieFPS',
	'SeriesSeason',
	'SeriesEpisode',
	'SeriesIMDBParent',
	'MovieKind',
	'URL'
] as const;

const BATCH_SIZE = 1_000;

type ParsedRow = {
	external_id: number;
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
	download_url: string | null;
};

function normalizeImdb(raw: string | undefined): string | null {
	const digits = (raw ?? '').trim();
	if (!digits || digits === '0') return null;
	return digits.startsWith('tt') ? digits.toLowerCase() : `tt${digits}`;
}

function toInt(raw: string | undefined): number | null {
	const t = (raw ?? '').trim();
	if (!t) return null;
	const n = Number.parseInt(t, 10);
	return Number.isFinite(n) ? n : null;
}

function parseRawCols(rawCols: string[]): ParsedRow | null {
	if (rawCols.length < EXPECTED_COLS.length) return null;

	const extra = rawCols.length - EXPECTED_COLS.length;
	const id = toInt(rawCols[0]);
	if (id == null || id <= 0) return null;

	const releaseParts = rawCols.slice(9, 10 + extra);
	const tail = rawCols.slice(10 + extra);
	if (tail.length !== 6) return null;

	const [movieFps, seriesSeason, seriesEpisode, seriesParent, movieKind, url] = tail;
	void movieFps;
	void seriesParent;

	const format = (rawCols[7] ?? '').trim().toLowerCase() || 'srt';
	const language = (rawCols[4] ?? '').trim().toLowerCase();
	const movieName = (rawCols[1] ?? '').trim() || null;
	const release = releaseParts.join('\t').trim() || null;

	return {
		external_id: id,
		language,
		format,
		release,
		file_name: release ? `${release}.${format}` : null,
		imdb_id: normalizeImdb(rawCols[6]),
		movie_name: movieName,
		movie_year: toInt(rawCols[2]),
		movie_kind: (movieKind ?? '').trim() || null,
		series_season: toInt(seriesSeason),
		series_episode: toInt(seriesEpisode),
		download_url: (url ?? '').trim() || `https://www.opensubtitles.org/en/subtitles/${id}`
	};
}

async function flushBatch(rows: ParsedRow[]): Promise<void> {
	if (rows.length === 0) return;

	const values: unknown[] = [];
	const placeholders: string[] = [];
	let i = 1;
	for (const r of rows) {
		placeholders.push(
			`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`
		);
		values.push(
			r.external_id,
			r.language,
			r.format,
			r.release,
			r.file_name,
			r.imdb_id,
			r.movie_name,
			r.movie_year,
			r.movie_kind,
			r.series_season,
			r.series_episode,
			r.download_url
		);
	}

	const sql = `
		INSERT INTO subtitles (
			external_id, language, format, release, file_name, imdb_id,
			movie_name, movie_year, movie_kind, series_season, series_episode, download_url
		)
		VALUES ${placeholders.join(',')}
		ON CONFLICT (external_id) DO UPDATE SET
			language = EXCLUDED.language,
			format = EXCLUDED.format,
			release = EXCLUDED.release,
			file_name = EXCLUDED.file_name,
			imdb_id = EXCLUDED.imdb_id,
			movie_name = EXCLUDED.movie_name,
			movie_year = EXCLUDED.movie_year,
			movie_kind = EXCLUDED.movie_kind,
			series_season = EXCLUDED.series_season,
			series_episode = EXCLUDED.series_episode,
			download_url = EXCLUDED.download_url,
			updated_at = NOW()
	`;

	await getPool().query(sql, values);
}

async function main() {
	const inputArg = process.argv[2];
	const inputPath = resolve(await resolveDumpPath(inputArg));
	log.info({ inputPath }, 'starting metadata import');

	const stream = createReadStream(inputPath).pipe(createGunzip());
	const rl = createInterface({ input: stream, crlfDelay: Infinity });

	let headerChecked = false;
	let buf: string[] = [];
	let batch: ParsedRow[] = [];
	let parsed = 0;
	let skipped = 0;
	const t0 = Date.now();

	for await (const line of rl) {
		const normalized = line.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

		if (!headerChecked) {
			const cols = normalized.split('\t');
			if (cols[0] !== 'IDSubtitle') {
				throw new Error(`Unexpected header: ${normalized.slice(0, 120)}`);
			}
			headerChecked = true;
			continue;
		}

		buf.push(normalized);
		const joined = buf.join('\n');
		const rawCols = joined.split('\t');

		if (rawCols.length < EXPECTED_COLS.length) continue;
		if (buf.length > 50) {
			skipped += 1;
			buf = [];
			continue;
		}

		const row = parseRawCols(rawCols);
		buf = [];
		if (!row) {
			skipped += 1;
			continue;
		}

		batch.push(row);
		if (batch.length >= BATCH_SIZE) {
			await flushBatch(batch);
			parsed += batch.length;
			batch = [];
			if (parsed % 100_000 === 0) {
				const elapsed = (Date.now() - t0) / 1000;
				log.info({ parsed, skipped, elapsed }, 'import progress');
			}
		}
	}

	await flushBatch(batch);
	parsed += batch.length;

	log.info({ parsed, skipped, seconds: (Date.now() - t0) / 1000 }, 'metadata import complete');
	await closePool();
}

main().catch(async (err) => {
	log.error(err, 'import failed');
	await closePool();
	process.exit(1);
});
