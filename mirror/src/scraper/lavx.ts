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

function formatFetchError(url: string, err: unknown): Error {
	const message = err instanceof Error ? err.message : String(err);
	return new Error(
		`Cannot reach LavX scraper at ${url} (${message}). ` +
			`Set OPENSUBTITLES_SCRAPER_URL to a reachable scraper (same Docker network), e.g. http://opensubtitles-scraper:8000`,
		{ cause: err }
	);
}

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

		let res: Response;
		try {
			res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify(body),
				signal: AbortSignal.timeout(this.timeoutMs)
			});
		} catch (err) {
			throw formatFetchError(url, err);
		}

		if (!res.ok) {
			const text = await res.text().catch(() => '');
			throw new Error(`LavX download failed ${res.status} from ${url}: ${text.slice(0, 300)}`);
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

	async health(): Promise<{ ok: boolean; detail: string }> {
		const url = `${this.baseUrl}/health`;
		try {
			const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
			return { ok: res.ok, detail: `${url} → HTTP ${res.status}` };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			return { ok: false, detail: `${url} → ${message}` };
		}
	}
}
