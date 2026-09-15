import { createWriteStream } from 'node:fs';
import { mkdir, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { createLogger } from './logger.ts';

const log = createLogger('download-dump');

function isHttpUrl(value: string): boolean {
	return /^https?:\/\//i.test(value);
}

async function assertGzipFile(path: string): Promise<number> {
	const file = Bun.file(path);
	if (!(await file.exists()) || file.size < 2) {
		throw new Error(`Downloaded file missing or empty: ${path}`);
	}

	const header = new Uint8Array(await file.slice(0, 2).arrayBuffer());
	if (header[0] !== 0x1f || header[1] !== 0x8b) {
		const peek = await file.slice(0, 200).text();
		throw new Error(
			`Downloaded file is not gzip (Cloudflare HTML challenge?). First bytes: ${peek.slice(0, 120).replace(/\s+/g, ' ')}`
		);
	}

	return file.size;
}

async function downloadWithCurl(url: string, dest: string): Promise<void> {
	log.info({ url, dest, method: 'curl' }, 'starting dump download');
	const proc = Bun.spawn(
		[
			'curl',
			'-fL',
			'--retry',
			'3',
			'--retry-delay',
			'5',
			'--connect-timeout',
			'30',
			'--max-time',
			'7200',
			'-A',
			'opensubtitles-mirror/0.0.1 (+private-archive)',
			'-o',
			dest,
			url
		],
		{ stdout: 'inherit', stderr: 'inherit' }
	);
	const code = await proc.exited;
	if (code !== 0) {
		throw new Error(`curl failed with exit code ${code} for ${url}`);
	}
}

async function downloadWithFetch(url: string, dest: string): Promise<void> {
	log.info({ url, dest, method: 'fetch' }, 'starting dump download');
	const res = await fetch(url, {
		redirect: 'follow',
		headers: {
			'User-Agent': 'opensubtitles-mirror/0.0.1 (+private-archive)',
			Accept: 'application/gzip, application/octet-stream, */*'
		},
		signal: AbortSignal.timeout(2 * 60 * 60 * 1000)
	});

	const contentType = res.headers.get('content-type') ?? '';
	const contentLength = res.headers.get('content-length');
	log.info({ status: res.status, contentType, contentLength }, 'dump response headers');

	if (!res.ok || !res.body) {
		throw new Error(`Failed to download dump: HTTP ${res.status} ${res.statusText}`);
	}

	if (contentType.includes('text/html')) {
		throw new Error(
			'Download returned HTML (likely Cloudflare challenge). Download the dump elsewhere and mount it, or set METADATA_DUMP_PATH to an existing .gz file.'
		);
	}

	const nodeReadable = Readable.fromWeb(res.body as import('node:stream/web').ReadableStream);
	const out = createWriteStream(dest);
	let bytes = 0;
	let lastLog = Date.now();

	nodeReadable.on('data', (chunk: Buffer) => {
		bytes += chunk.length;
		const now = Date.now();
		if (now - lastLog > 5_000) {
			lastLog = now;
			log.info({ bytes }, 'download progress');
		}
	});

	await pipeline(nodeReadable, out);
	log.info({ bytes }, 'fetch stream finished');
}

export async function resolveDumpPath(input?: string): Promise<string> {
	const fromArg = input?.trim();
	const fromEnv = process.env.METADATA_DUMP_URL?.trim();
	const cachePath = process.env.METADATA_DUMP_PATH?.trim() || '/data/subtitles_all.txt.gz';
	const force = ['1', 'true', 'yes'].includes(
		(process.env.METADATA_DUMP_FORCE_DOWNLOAD ?? '').trim().toLowerCase()
	);

	const source = fromArg || fromEnv;
	if (!source) {
		throw new Error(
			'Provide a local path, URL argument, or set METADATA_DUMP_URL (e.g. https://dl.opensubtitles.org/addons/export/subtitles_all.txt.gz)'
		);
	}

	if (!isHttpUrl(source)) {
		return source;
	}

	const existing = Bun.file(cachePath);
	if (!force && (await existing.exists()) && existing.size > 0) {
		try {
			const bytes = await assertGzipFile(cachePath);
			log.info({ cachePath, bytes }, 'using cached dump file');
			return cachePath;
		} catch (err) {
			log.warn({ err }, 'cached dump invalid; re-downloading');
		}
	}

	await mkdir(dirname(cachePath), { recursive: true });
	const tmpPath = `${cachePath}.partial`;
	await unlink(tmpPath).catch(() => undefined);

	try {
		try {
			await downloadWithCurl(source, tmpPath);
		} catch (curlErr) {
			log.warn({ err: curlErr }, 'curl download failed; falling back to fetch');
			await unlink(tmpPath).catch(() => undefined);
			await downloadWithFetch(source, tmpPath);
		}

		const bytes = await assertGzipFile(tmpPath);
		await rename(tmpPath, cachePath);
		log.info({ cachePath, bytes }, 'dump download complete');
		return cachePath;
	} catch (err) {
		await unlink(tmpPath).catch(() => undefined);
		throw err;
	}
}
