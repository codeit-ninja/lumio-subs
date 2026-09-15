# OpenSubtitles mirror

Private archive pipeline: **Postgres** (metadata) + **Cloudflare R2** (gzipped subtitle files). Downloads go through the LavX `opensubtitles-scraper` already defined in the repo root `docker-compose.yml`.

## Prerequisites

- Bun (local) or Docker
- Cloudflare R2 bucket + S3 API token
- Root stack running (`flaresolverr` + `opensubtitles-scraper` at ~10 req/s)

## Local setup

```bash
cd mirror
cp .env.example .env
# fill R2_* and confirm DATABASE_URL / OPENSUBTITLES_SCRAPER_URL

bun install
docker compose up -d postgres
bun run db:init
```

Download the official metadata export:

- https://dl.opensubtitles.org/addons/export/ → `subtitles_all.txt.gz`

```bash
mkdir -p data
bun run import-metadata -- ./data/subtitles_all.txt.gz
docker compose --profile worker up -d --build worker
bun run status
```

## Docker image (GHCR)

Workflow [`.github/workflows/mirror-image.yml`](../.github/workflows/mirror-image.yml) builds `mirror/` and pushes:

`ghcr.io/<github-username-or-org>/opensubtitles-mirror:latest`

Triggers: push to default branch touching `mirror/**`, or manual **workflow_dispatch**.

### Private repo — does that matter?

**No Pro/Enterprise needed.** On GitHub Free you get Actions + Packages for private repos within quotas (roughly 2 000 Actions minutes/month and 500 MB Packages storage shared with artifacts).

What _does_ matter:

| Topic                     | Detail                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Building                  | Works with `GITHUB_TOKEN` in the workflow (`packages: write`)                                                               |
| Image visibility          | GHCR package defaults to **private** — fine for a private archive                                                           |
| Pulling on VPS / Dockhand | Host must `docker login ghcr.io` with a PAT that has `read:packages` (and `write:packages` only if you push from elsewhere) |
| Minutes                   | Each build uses some Actions minutes; stay under Free quota or set a spending budget to $0                                  |

Create a classic PAT (or fine-grained with Packages read) → on the VPS:

```bash
echo YOUR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
docker pull ghcr.io/YOUR_USER/opensubtitles-mirror:latest
```

In Dockhand/Hawser, add the same registry credentials so pulls succeed.

## Deploy compose (Dockhand)

Use [`docker-compose.deploy.yml`](docker-compose.deploy.yml) — no bind mounts.

1. Set stack env in Dockhand:

```
MIRROR_IMAGE=ghcr.io/YOUR_USER/opensubtitles-mirror:latest
POSTGRES_PASSWORD=strong-password
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=opensubtitles-mirror
OPENSUBTITLES_SCRAPER_URL=http://opensubtitles-scraper:8000
WORKER_RATE_PER_SECOND=10
METADATA_DUMP_URL=https://dl.opensubtitles.org/addons/export/subtitles_all.txt.gz
```

2. Paste/deploy `docker-compose.deploy.yml` (or Git path `mirror/docker-compose.deploy.yml`).
3. **importer** downloads the dump (cached on `mirror_data`) and upserts into Postgres — can take hours the first time. **worker** starts only after importer exits successfully.
4. Re-deploy reuses the cached `.gz` unless you set `METADATA_DUMP_FORCE_DOWNLOAD=true`.

Local / one-shot:

```bash
# URL via env
METADATA_DUMP_URL=https://dl.opensubtitles.org/addons/export/subtitles_all.txt.gz \
  bun run import-metadata

# or pass URL / path as argument
bun run import-metadata -- https://dl.opensubtitles.org/addons/export/subtitles_all.txt.gz
bun run import-metadata -- ./data/subtitles_all.txt.gz
```

Note: `dl.opensubtitles.org` sits behind Cloudflare; downloads from a VPS/datacenter IP can fail or challenge. If that happens, download elsewhere and mount the file, or set `METADATA_DUMP_PATH` to an already-present file.

Expect **~12 days** ideal at 10 req/s; **2–4+ weeks** realistic. Budget **~200–300 GB** R2.

## Layout

| Path                        | Role                                       |
| --------------------------- | ------------------------------------------ |
| `Dockerfile`                | Production image                           |
| `docker-compose.yml`        | Local Postgres + optional worker build     |
| `docker-compose.deploy.yml` | Dockhand / VPS (GHCR image)                |
| `sql/*.sql`                 | Schema (applied by `db-init` / entrypoint) |
| `src/jobs/*`                | import / worker / status                   |

Object key format: `subs/{external_id}.gz`.
