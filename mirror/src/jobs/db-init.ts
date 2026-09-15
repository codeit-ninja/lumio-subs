import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { closePool, initSchema } from '../db.ts';
import { createLogger } from '../logger.ts';

const log = createLogger('db-init');

const sqlDir = resolve(import.meta.dir, '../../sql');
const files = (await readdir(sqlDir)).filter((f) => f.endsWith('.sql')).sort();

for (const file of files) {
	const sqlPath = resolve(sqlDir, file);
	await initSchema(sqlPath);
	log.info({ sqlPath }, 'schema applied');
}

await closePool();
