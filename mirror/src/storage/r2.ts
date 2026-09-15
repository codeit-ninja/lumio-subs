import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import type { Config } from '../config.ts';

export function createR2Client(cfg: Config): S3Client {
	return new S3Client({
		region: 'auto',
		endpoint: cfg.R2_ENDPOINT,
		credentials: {
			accessKeyId: cfg.R2_ACCESS_KEY_ID,
			secretAccessKey: cfg.R2_SECRET_ACCESS_KEY
		},
		forcePathStyle: true
	});
}

export function storageKeyFor(externalId: string | number): string {
	return `subs/${externalId}.gz`;
}

export function publicUrlFor(publicBaseUrl: string, key: string): string {
	return `${publicBaseUrl.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`;
}

export async function objectExists(
	client: S3Client,
	bucket: string,
	key: string
): Promise<boolean> {
	try {
		await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
		return true;
	} catch (err) {
		const name = err instanceof Error ? err.name : '';
		const status =
			typeof err === 'object' && err && '$metadata' in err
				? (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
				: undefined;
		if (name === 'NotFound' || name === 'NoSuchKey' || status === 404) return false;
		throw err;
	}
}

export async function putGzipObject(
	client: S3Client,
	bucket: string,
	key: string,
	body: Uint8Array,
	contentType = 'application/gzip'
): Promise<void> {
	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ContentType: contentType
		})
	);
}
