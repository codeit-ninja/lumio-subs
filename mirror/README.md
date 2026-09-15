# OpenSubtitles mirror

Private archive pipeline: **Postgres** (metadata) + **Cloudflare R2** (gzipped subtitle files). Downloads go through the LavX `opensubtitles-scraper` already defined in the repo root `docker-compose.yml`.

## Prerequisites

- Bun
- Docker
- Cloudflare R2 bucket + S3 API token
- Root stack running (`flaresolverr` + `opensubtitles-scraper` at ~10 req/s)

## Setup

```bash
cd mirror
cp .env.example .env
# fill R2_* and confirm DATABASE_URL / OPENSUBTITLES_SCRAPER_URL

bun install
docker compose up -d postgres
bun run db:init   # safe to re-run; also applied on first Postgres boot via init SQL
```

Download the official metadata export:

- https://dl.opensubtitles.org/addons/export/ → `subtitles_all.txt.gz`

```bash
mkdir -p data
# place subtitles_all.txt.gz in data/
bun run import-metadata -- ./data/subtitles_all.txt.gz
```

## Run the worker

With scraper reachable at `OPENSUBTITLES_SCRAPER_URL` (default `http://127.0.0.1:8000`):

```bash
bun run worker
```

Or via Compose profile (talks to scraper on the host):

```bash
docker compose --profile worker up -d worker
```

Progress:

```bash
bun run status
```

## VPS deploy (short)

1. Create R2 bucket + API token; put credentials in `mirror/.env`.
2. On the VPS, start root compose (scraper @ 10 req/s) and mirror Postgres:

```bash
docker compose up -d flaresolverr opensubtitles-scraper
docker compose -f mirror/docker-compose.yml up -d postgres
```

3. Import metadata, then start the worker (host or `--profile worker`).
4. Expect **~12 days** ideal at 10 req/s for ~10.7M files; **2–4+ weeks** with blocks/retries. Budget **~200–300 GB** R2.

## Layout

| Path                          | Role                                    |
| ----------------------------- | --------------------------------------- |
| `sql/001_init.sql`            | Schema                                  |
| `src/jobs/import-metadata.ts` | Bulk upsert from `subtitles_all.txt.gz` |
| `src/jobs/download-worker.ts` | Resume-safe download → gzip → R2        |
| `src/jobs/status.ts`          | Counts + ETA                            |
| `src/storage/r2.ts`           | S3/R2 client                            |
| `src/scraper/lavx.ts`         | LavX download client                    |

Object key format: `subs/{external_id}.gz`.
