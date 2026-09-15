import * as cheerio from 'cheerio';
import { errAsync, okAsync, ResultAsync as RA } from 'neverthrow';

import type { AppError } from '../result';
import { ERROR_CODE, fromHttpBytes, httpError } from '../result';
import type { ProviderHit, SubtitleProvider, SubtitleQuery } from './types';

const BASE = 'https://subf2m.co';
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
		throw httpError(ERROR_CODE.SCRAPE_FAILED, res.status, `Subf2m HTTP ${res.status}`);
	}
	return res.text();
}

function langPath(code: string): string {
	const map: Record<string, string> = {
		en: 'english',
		nl: 'dutch',
		de: 'german',
		fr: 'french',
		es: 'spanish',
		it: 'italian',
		pt: 'portuguese',
		ar: 'arabic',
		zh: 'chinese',
		ja: 'japanese',
		ko: 'korean',
		ru: 'russian',
		sv: 'swedish',
		no: 'norwegian',
		da: 'danish',
		fi: 'finnish',
		pl: 'polish',
		tr: 'turkish',
		he: 'hebrew',
		fa: 'farsi_persian',
		bg: 'bulgarian',
		hr: 'croatian',
		cs: 'czech',
		el: 'greek',
		hu: 'hungarian',
		id: 'indonesian',
		ro: 'romanian',
		sr: 'serbian',
		th: 'thai',
		vi: 'vietnamese'
	};
	return map[code.toLowerCase()] ?? code.toLowerCase();
}

export class Subf2mProvider implements SubtitleProvider {
	id = 'subf2m';
	name = 'Subf2m';
	supports = { movies: true, tv: true };

	search(q: SubtitleQuery): RA<ProviderHit[], AppError> {
		const lang = (q.languages?.[0] ?? 'en').toLowerCase();
		const langSlug = langPath(lang);

		return RA.fromPromise(
			(async () => {
				const slug = await this.resolveSlug(q);
				if (!slug) return [] as ProviderHit[];

				const listPath =
					q.season != null && q.episode != null
						? `/subtitles/${slug}/season-${q.season}/episode-${q.episode}/${langSlug}`
						: `/subtitles/${slug}/${langSlug}`;
				const listUrl = `${BASE}${listPath}`;
				const html = await fetchHtml(listUrl);
				const $ = cheerio.load(html);
				const hits: ProviderHit[] = [];

				$('li.item a.download[href*="/subtitles/"], a.download.icon-download').each((_, el) => {
					const href = $(el).attr('href');
					if (!href) return;

					const item = $(el).closest('li.item');
					const release =
						item.find('ul.scrolllist li').first().text().replace(/\s+/g, ' ').trim() ||
						item.text().replace(/\s+/g, ' ').trim().slice(0, 200) ||
						undefined;
					const abs = href.startsWith('http')
						? href
						: `${BASE}${href.startsWith('/') ? '' : '/'}${href}`;
					const idMatch = abs.match(/\/(\d+)(?:\/download)?\/?$/);
					const externalId = idMatch?.[1] ?? abs;

					hits.push({
						provider: this.id,
						externalId,
						language: lang,
						format: 'srt',
						release,
						rawUrl: abs,
						download: () => this.download(abs, listUrl)
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
							e instanceof Error ? e.message : 'Subf2m scrape failed'
						)
		).orElse(() => okAsync([]));
	}

	downloadByExternalId(externalId: string, rawUrl?: string | null): RA<Uint8Array, AppError> {
		const pageUrl =
			rawUrl?.trim() ||
			(externalId.startsWith('http')
				? externalId
				: /^\d+$/.test(externalId)
					? `${BASE}/subtitles/${externalId}`
					: externalId.includes('/')
						? `${BASE}${externalId.startsWith('/') ? '' : '/'}${externalId}`
						: '');
		if (!pageUrl) {
			return errAsync(httpError(ERROR_CODE.SCRAPE_FAILED, 400, 'Missing Subf2m subtitle URL'));
		}
		return this.download(pageUrl, pageUrl);
	}

	private async resolveSlug(q: SubtitleQuery): Promise<string | null> {
		const queries = [q.imdbId, q.title].filter((v): v is string => Boolean(v?.trim()));
		for (const query of queries) {
			const searchUrl = `${BASE}/subtitles/searchbytitle?query=${encodeURIComponent(query.trim())}`;
			const html = await fetchHtml(searchUrl);
			const $ = cheerio.load(html);
			const href =
				$('a[href^="/subtitles/"]')
					.filter((_, el) => {
						const path = $(el).attr('href') ?? '';
						return /^\/subtitles\/[^/]+\/?$/.test(path) && !path.includes('searchbytitle');
					})
					.first()
					.attr('href') ??
				$('a[href*="/subtitles/"]').not('[href*="searchbytitle"]').first().attr('href');

			if (!href) continue;
			const match = href.match(/\/subtitles\/([^/?#]+)/i);
			if (match?.[1]) return match[1];
		}
		return null;
	}

	private download(itemUrl: string, referer: string): RA<Uint8Array, AppError> {
		return RA.fromPromise(
			(async () => {
				const pageUrl = itemUrl.endsWith('/download')
					? itemUrl.replace(/\/download$/, '')
					: itemUrl;
				const downloadUrl = pageUrl.endsWith('/download') ? pageUrl : `${pageUrl}/download`;

				const bytes = await fromHttpBytes(downloadUrl, {
					headers: {
						'User-Agent': BROWSER_UA,
						Accept: '*/*',
						Referer: pageUrl === downloadUrl ? referer : pageUrl
					},
					redirect: 'follow'
				});
				if (bytes.isOk()) return bytes.value;

				// Fall back: open detail page then hit download button href
				const html = await fetchHtml(pageUrl, referer);
				const $ = cheerio.load(html);
				const href =
					$('#downloadButton').attr('href') ??
					$('a[href$="/download"]').attr('href') ??
					$('a[href*="/subtitleserve/"]').attr('href');
				if (!href) {
					throw httpError(ERROR_CODE.SCRAPE_FAILED, 404, 'Subf2m download not found');
				}
				const abs = href.startsWith('http')
					? href
					: `${BASE}${href.startsWith('/') ? '' : '/'}${href}`;
				const retry = await fromHttpBytes(abs, {
					headers: {
						'User-Agent': BROWSER_UA,
						Accept: '*/*',
						Referer: pageUrl
					}
				});
				if (retry.isErr()) throw retry.error;
				return retry.value;
			})(),
			(e) =>
				typeof e === 'object' && e && 'kind' in e
					? (e as AppError)
					: httpError(
							ERROR_CODE.SCRAPE_FAILED,
							502,
							e instanceof Error ? e.message : 'Subf2m download failed'
						)
		);
	}
}
