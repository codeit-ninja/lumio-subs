import { mkdir, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';

import { createLogger } from './logger.ts';

const log = createLogger('download-dump');

function isHttpUrl(value: string): boolean {
	return /^https?:\/\//i.test(value);
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
		log.info({ cachePath, bytes: existing.size }, 'using cached dump file');
		return cachePath;
	}

	await mkdir(dirname(cachePath), { recursive: true });
	log.info({ url: source, cachePath }, 'downloading metadata dump');

	const res = await fetch(source, {
		redirect: 'follow',
		headers: {
			'User-Agent': 'opensubtitles-mirror/0.0.1 (+private-archive)'
		},
		signal: AbortSignal.timeout(60 * 60 * 1000)
	});

	if (!res.ok || !res.body) {
		throw new Error(`Failed to download dump: HTTP ${res.status} ${res.statusText}`);
	}

	const tmpPath = `${cachePath}.partial`;
	await Bun.write(tmpPath, res);
	await rename(tmpPath, cachePath).catch(async () => {
		await Bun.write(cachePath, Bun.file(tmpPath));
		await unlink(tmpPath).catch(() => undefined);
	});

	const saved = Bun.file(cachePath);
	log.info({ cachePath, bytes: saved.size }, 'dump download complete');
	return cachePath;
}
