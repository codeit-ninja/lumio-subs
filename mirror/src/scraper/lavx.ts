import { z } from 'zod';

const downloadResponseSchema = z.object({
	filename: z.string().optional().default(''),
	content: z.string().min(1),
	size: z.number().optional(),
	encoding: z.string().optional()
});

export type DownloadedSubtitle = {
	filename: string;
	bytes: Uint8Array;
};

export class LavxClient {
	constructor(
		private readonly baseUrl: string,
		private readonly timeoutMs = 90_000
	) {}

	async downloadSubtitle(
		subtitleId: string,
		downloadUrl?: string | null
	): Promise<DownloadedSubtitle> {
		const url = `${this.baseUrl}/api/v1/download/subtitle`;
		const body = {
			subtitle_id: String(subtitleId),
			download_url:
				downloadUrl?.trim() || `https://www.opensubtitles.org/en/subtitles/${subtitleId}`
		};

		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(this.timeoutMs)
		});

		if (!res.ok) {
			const text = await res.text().catch(() => '');
			throw new Error(`LavX download failed ${res.status}: ${text.slice(0, 300)}`);
		}

		const json: unknown = await res.json();
		const parsed = downloadResponseSchema.safeParse(json);
		if (!parsed.success) {
			throw new Error(`LavX download response invalid: ${parsed.error.message}`);
		}

		const bytes = Buffer.from(parsed.data.content, 'base64');
		return {
			filename: parsed.data.filename || `${subtitleId}.srt`,
			bytes: new Uint8Array(bytes)
		};
	}

	async health(): Promise<boolean> {
		try {
			const res = await fetch(`${this.baseUrl}/health`, {
				signal: AbortSignal.timeout(10_000)
			});
			return res.ok;
		} catch {
			return false;
		}
	}
}
