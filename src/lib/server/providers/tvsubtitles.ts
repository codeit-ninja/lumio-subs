import * as cheerio from 'cheerio';
import { errAsync, okAsync, ResultAsync as RA } from 'neverthrow';

import type { AppError } from '../result';
import { ERROR_CODE, fromHttpBytes, httpError } from '../result';
import type { ProviderHit, SubtitleProvider, SubtitleQuery } from './types';

const BASE = 'https://www.tvsubtitles.net';

async function fetchHtml(url: string): Promise<string> {
	const res = await fetch(url, {
		headers: {
			'User-Agent': 'LumioSubs/0.1',
			Accept: 'text/html'
		}
	});
	if (!res.ok) {
		throw httpError(ERROR_CODE.SCRAPE_FAILED, res.status, `TVSubtitles HTTP ${res.status}`);
	}
	return res.text();
}

export class TvSubtitlesProvider implements SubtitleProvider {
	id = 'tvsubtitles';
	name = 'TVSubtitles';
	supports = { movies: false, tv: true };

	search(q: SubtitleQuery): RA<ProviderHit[], AppError> {
		if (q.season == null || q.episode == null || !q.title?.trim()) {
			return okAsync([]);
		}

		const lang = (q.languages?.[0] ?? 'en').toLowerCase();
		const query = q.title.trim();

		return RA.fromPromise(
			(async () => {
				const searchHtml = await fetchHtml(`${BASE}/search.php?q=${encodeURIComponent(query)}`);
				const $s = cheerio.load(searchHtml);
				const showHref =
					$s('a[href*="/tvshow-"]').first().attr('href') ??
					$s('a[href*="tvshow"]').first().attr('href');
				if (!showHref) return [] as ProviderHit[];

				const showUrl = showHref.startsWith('http')
					? showHref
					: `${BASE}/${showHref.replace(/^\//, '')}`;
				const showHtml = await fetchHtml(showUrl);
				const $show = cheerio.load(showHtml);

				const epPattern = new RegExp(
					`${String(q.season).padStart(2, '0')}\\s*[x×]\\s*${String(q.episode).padStart(2, '0')}`,
					'i'
				);
				let episodeHref: string | undefined;
				$show('a[href*="episode"]').each((_, el) => {
					const t = $show(el).text();
					if (epPattern.test(t) || t.includes(`S${q.season}E${q.episode}`)) {
						episodeHref = $show(el).attr('href') ?? undefined;
					}
				});
				if (!episodeHref) return [];

				const epUrl = episodeHref.startsWith('http')
					? episodeHref
					: `${BASE}/${episodeHref.replace(/^\//, '')}`;
				const epHtml = await fetchHtml(epUrl);
				const $ep = cheerio.load(epHtml);
				const hits: ProviderHit[] = [];

				$ep(`a[href*="/subtitle-"], a[href*="download-"]`).each((_, el) => {
					const href = $ep(el).attr('href');
					if (!href) return;
					const rowText = $ep(el).closest('tr, li, div').text().toLowerCase();
					if (lang !== 'en' && !rowText.includes(lang) && !rowText.includes(langName(lang))) {
						return;
					}
					const abs = href.startsWith('http') ? href : `${BASE}/${href.replace(/^\//, '')}`;
					hits.push({
						provider: this.id,
						externalId: abs.replace(/^https?:\/\//, ''),
						language: lang,
						format: 'srt',
						release: $ep(el).text().trim().slice(0, 200) || undefined,
						rawUrl: abs,
						download: () =>
							fromHttpBytes(abs, { headers: { 'User-Agent': 'LumioSubs/0.1' } }).mapErr((e) =>
								e.kind === 'http' ? httpError(ERROR_CODE.SCRAPE_FAILED, e.status, e.message) : e
							)
					});
				});

				return hits.slice(0, 30);
			})(),
			(e) =>
				typeof e === 'object' && e && 'kind' in e
					? (e as AppError)
					: httpError(
							ERROR_CODE.SCRAPE_FAILED,
							502,
							e instanceof Error ? e.message : 'TVSubtitles scrape failed'
						)
		).orElse(() => okAsync([]));
	}

	downloadByExternalId(externalId: string, rawUrl?: string | null): RA<Uint8Array, AppError> {
		const url =
			rawUrl?.trim() || (externalId.includes('://') ? externalId : `https://${externalId}`);
		if (!url) {
			return errAsync(httpError(ERROR_CODE.SCRAPE_FAILED, 400, 'Missing TVSubtitles URL'));
		}
		return fromHttpBytes(url, { headers: { 'User-Agent': 'LumioSubs/0.1' } }).mapErr((e) =>
			e.kind === 'http' ? httpError(ERROR_CODE.SCRAPE_FAILED, e.status, e.message) : e
		);
	}
}

function langName(code: string): string {
	const map: Record<string, string> = {
		en: 'english',
		nl: 'dutch',
		de: 'german',
		fr: 'french',
		es: 'spanish'
	};
	return map[code] ?? code;
}
