-- Drop unused enrichment columns (not in metadata export; download API does not return them).
DROP INDEX IF EXISTS idx_subtitles_hash;
ALTER TABLE subtitles DROP COLUMN IF EXISTS hearing_impaired;
ALTER TABLE subtitles DROP COLUMN IF EXISTS hash;
ALTER TABLE subtitles DROP COLUMN IF EXISTS download_count;
