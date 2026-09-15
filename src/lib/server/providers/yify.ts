import * as cheerio from 'cheerio';
import { errAsync, okAsync, ResultAsync as RA } from 'neverthrow';

import type { AppError } from '../result';
import { ERROR_CODE, fromHttpBytes, httpError } from '../result';
import type { ProviderHit, SubtitleProvider, SubtitleQuery } from './types';

const BASE = 'https://yifysubtitles.ch';
const BROWSER_UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchHtml(url: string, referer?: string): Promise<string> {
	const res = await fetch(url, {
		headers: {
			'User-Agent': BROWSER_UA,
			Accept: 'text/html,application/xhtml+xml',
			...(referer ? { Referer: referer } : {})
		}
	});
	if (!res.ok) {
		throw httpError(ERROR_CODE.SCRAPE_FAILED, res.status, `YIFY HTTP ${res.status}`);
	}
	return res.text();
}

export class YifyProvider implements SubtitleProvider {
	id = 'yify';
	name = 'YIFY Subtitles';
	supports = { movies: true, tv: false };

	search(q: SubtitleQuery): RA<ProviderHit[], AppError> {
		if (!q.imdbId || q.season != null || q.episode != null) {
			return okAsync([]);
		}

		const imdb = q.imdbId.toLowerCase();
		const wanted = new Set((q.languages ?? ['en']).map((l) => l.toLowerCase()));

		return RA.fromPromise(
			(async () => {
				const listUrl = `${BASE}/movie-imdb/${imdb}`;
				const html = await fetchHtml(listUrl);
				const $ = cheerio.load(html);
				const hits: ProviderHit[] = [];

				$('.other-subs tbody tr, table.table tbody tr').each((_, el) => {
					const row = $(el);
					const langText = row.find('.sub-lang').first().text().trim().toLowerCase();
					const langCode = guessLang(langText);
					if (!langCode || (wanted.size > 0 && !wanted.has(langCode))) {
						return;
					}

					const href = row.find('a[href*="/subtitles/"]').attr('href');
					if (!href) return;

					const release =
						row
							.find('a[href*="/subtitles/"]')
							.text()
							.replace(/\s+/g, ' ')
							.replace(/^subtitle\s*/i, '')
							.trim() || undefined;
					const abs = href.startsWith('http')
						? href
						: `${BASE}${href.startsWith('/') ? '' : '/'}${href}`;
					const externalId = abs.replace(/^https?:\/\//, '');

					hits.push({
						provider: this.id,
						externalId,
						language: langCode,
						format: 'srt',
						release,
						rawUrl: abs,
						download: () => this.downloadFromPage(abs, listUrl)
					});
				});

				return hits.slice(0, 40);
			})(),
			(e) =>
				typeof e === 'object' && e && 'kind' in e
					? (e as AppError)
					: httpError(
							ERROR_CODE.SCRAPE_FAILED,
							502,
							e instanceof Error ? e.message : 'YIFY scrape failed'
						)
		).orElse(() => okAsync([]));
	}

	downloadByExternalId(externalId: string, rawUrl?: string | null): RA<Uint8Array, AppError> {
		const pageUrl =
			rawUrl?.trim() || (externalId.includes('://') ? externalId : `https://${externalId}`);
		if (!pageUrl) {
			return errAsync(httpError(ERROR_CODE.SCRAPE_FAILED, 400, 'Missing YIFY subtitle URL'));
		}
		return this.downloadFromPage(pageUrl, pageUrl);
	}

	private downloadFromPage(pageUrl: string, referer: string): RA<Uint8Array, AppError> {
		return RA.fromPromise(
			(async () => {
				const html = await fetchHtml(pageUrl, referer);
				const $ = cheerio.load(html);
				const zipHref =
					$('a[href*=".zip"]').attr('href') ??
					$('a.download-subtitle, a[href*="/subtitle/"]').attr('href');
				if (!zipHref) {
					throw httpError(ERROR_CODE.SCRAPE_FAILED, 404, 'YIFY download link not found');
				}
				const abs = zipHref.startsWith('http')
					? zipHref
					: `${BASE}${zipHref.startsWith('/') ? '' : '/'}${zipHref}`;
				const bytes = await fromHttpBytes(abs, {
					headers: {
						'User-Agent': BROWSER_UA,
						Accept: '*/*',
						Referer: pageUrl
					}
				});
				if (bytes.isErr()) throw bytes.error;
				return bytes.value;
			})(),
			(e) =>
				typeof e === 'object' && e && 'kind' in e
					? (e as AppError)
					: httpError(
							ERROR_CODE.SCRAPE_FAILED,
							502,
							e instanceof Error ? e.message : 'YIFY download failed'
						)
		);
	}
}

function guessLang(text: string): string | null {
	const map: Record<string, string> = {
		english: 'en',
		dutch: 'nl',
		german: 'de',
		french: 'fr',
		spanish: 'es',
		italian: 'it',
		portuguese: 'pt',
		'brazilian portuguese': 'pt',
		arabic: 'ar',
		chinese: 'zh',
		japanese: 'ja',
		korean: 'ko',
		russian: 'ru',
		swedish: 'sv',
		norwegian: 'no',
		danish: 'da',
		finnish: 'fi',
		polish: 'pl',
		turkish: 'tr',
		hebrew: 'he',
		'farsi/persian': 'fa',
		farsi: 'fa',
		persian: 'fa',
		bulgarian: 'bg',
		croatian: 'hr',
		czech: 'cs',
		greek: 'el',
		hungarian: 'hu',
		indonesian: 'id',
		macedonian: 'mk',
		romanian: 'ro',
		serbian: 'sr',
		thai: 'th',
		vietnamese: 'vi',
		bengali: 'bn'
	};
	const key = text.toLowerCase().trim();
	if (map[key]) return map[key]!;
	if (/^[a-z]{2}$/i.test(key)) return key.toLowerCase();
	for (const [name, code] of Object.entries(map)) {
		if (key.includes(name)) return code;
	}
	return null;
}
