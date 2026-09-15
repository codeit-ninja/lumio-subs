-- Keep OpenSubtitles scrape URL separate from the public R2 download_url.
ALTER TABLE subtitles ADD COLUMN IF NOT EXISTS source_url TEXT;

UPDATE subtitles
SET source_url = download_url
WHERE source_url IS NULL
  AND download_url IS NOT NULL
  AND download_url ILIKE '%opensubtitles%';

UPDATE subtitles
SET download_url = NULL
WHERE status IN ('pending', 'failed', 'skipped')
  AND download_url ILIKE '%opensubtitles%';

CREATE INDEX IF NOT EXISTS idx_subtitles_source_url
	ON subtitles (source_url)
	WHERE source_url IS NOT NULL;
