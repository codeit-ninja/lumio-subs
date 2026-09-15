CREATE TABLE IF NOT EXISTS subtitles (
	external_id BIGINT PRIMARY KEY,
	language TEXT NOT NULL DEFAULT '',
	format TEXT NOT NULL DEFAULT '',
	release TEXT,
	file_name TEXT,
	imdb_id TEXT,
	movie_name TEXT,
	movie_year INTEGER,
	movie_kind TEXT,
	series_season INTEGER,
	series_episode INTEGER,
	download_url TEXT,
	storage_key TEXT,
	bytes_size INTEGER,
	status TEXT NOT NULL DEFAULT 'pending'
		CHECK (status IN ('pending', 'stored', 'failed', 'skipped')),
	error TEXT,
	attempts INTEGER NOT NULL DEFAULT 0,
	lease_until TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subtitles_status ON subtitles (status);
CREATE INDEX IF NOT EXISTS idx_subtitles_claim
	ON subtitles (status, lease_until, external_id);
CREATE INDEX IF NOT EXISTS idx_subtitles_imdb_lang ON subtitles (imdb_id, language);
CREATE INDEX IF NOT EXISTS idx_subtitles_updated_stored
	ON subtitles (updated_at DESC)
	WHERE status = 'stored';

CREATE TABLE IF NOT EXISTS worker_stats (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	stored_last_minute INTEGER NOT NULL DEFAULT 0,
	failed_last_minute INTEGER NOT NULL DEFAULT 0,
	window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO worker_stats (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
