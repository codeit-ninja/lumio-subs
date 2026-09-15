import { createHash } from 'node:crypto';

import { unzipSync } from 'fflate';
import { VTT } from 'js-vtt';

const ZIP_MAGIC = [0x50, 0x4b] as const;
const SUBTITLE_EXT = /\.(srt|vtt|ass|ssa|sub)$/i;

/** If bytes are a ZIP archive, extract the first subtitle file; otherwise return as-is. */
export function ensureSubtitleBytes(bytes: Uint8Array): Uint8Array {
	if (bytes.length < 4 || bytes[0] !== ZIP_MAGIC[0] || bytes[1] !== ZIP_MAGIC[1]) {
		return bytes;
	}

	const files = unzipSync(bytes);
	const names = Object.keys(files).filter((name) => !name.endsWith('/'));
	const preferred =
		names.find((name) => SUBTITLE_EXT.test(name)) ?? names.sort((a, b) => a.localeCompare(b))[0];
	if (!preferred) {
		throw new Error('ZIP archive contained no subtitle files');
	}

	const extracted = files[preferred];
	if (!extracted?.length) {
		throw new Error(`Empty file in ZIP: ${preferred}`);
	}
	return extracted;
}

function parseSubtitle(raw: string): VTT {
	const trimmed = raw.replace(/^\uFEFF/, '').trim();
	return trimmed.startsWith('WEBVTT') ? VTT.fromString(trimmed) : VTT.fromSRT(trimmed);
}

/** Convert SRT (or already-VTT) text to WebVTT. */
export function toVtt(raw: string): string {
	return parseSubtitle(raw).toString('vtt');
}

/** Convert VTT (or already-SRT) text to SubRip. */
export function toSrt(raw: string): string {
	return parseSubtitle(raw).toString('srt');
}

export function decodeSubtitleBytes(bytes: Uint8Array): string {
	const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
	if (!utf8.includes('\uFFFD')) {
		return utf8;
	}

	try {
		return new TextDecoder('latin1').decode(bytes);
	} catch {
		return utf8;
	}
}

export function contentHash(bytes: Uint8Array): string {
	return createHash('sha256').update(bytes).digest('hex').slice(0, 32);
}

export function guessFormat(fileName?: string | null, fallback: string = 'srt'): string {
	const lower = (fileName ?? '').toLowerCase();
	if (lower.endsWith('.vtt')) return 'vtt';
	if (lower.endsWith('.ass') || lower.endsWith('.ssa')) return 'ass';
	if (lower.endsWith('.sub')) return 'sub';
	if (lower.endsWith('.srt')) return 'srt';
	return fallback;
}
