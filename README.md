# Lumio Subs

Standalone subtitle aggregator: multi-provider search, PocketBase cache, JSON API + search UI.

Not Wyzie-compatible — own API contract. Intended as a self-hosted replacement for unreliable third-party subtitle proxies.

## Stack

- SvelteKit 5 + `@sveltejs/adapter-bun`
- neverthrow services, Zod transforms
- bits-ui + Iconify UI
- PocketBase (+ [pocketbase-schema-generator](https://github.com/satohshi/pocketbase-schema-generator) under `pocketbase/pb_hooks/`)

## Quick start

```bash
cp .env.example .env
# fill TMDB_API_KEY, PB_ADMIN_*
docker compose up -d   # PocketBase + LavX OpenSubtitles scraper + FlareSolverr
bun install
bun run dev
```

- App: http://127.0.0.1:5180
- PocketBase: http://127.0.0.1:8093
- OpenSubtitles scraper: http://127.0.0.1:8000 (`/docs` for Swagger)

Create the PocketBase admin on first boot if the container does not auto-create from `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` (depends on image). Schema migrations run from `pocketbase/pb_migrations/`. Generated types appear in `src/lib/pocketbase/` after PB bootstrap.

## API

### `GET /api/search`

| Param     | Description                 |
| --------- | --------------------------- |
| `imdb`    | IMDb id (`tt…`) — preferred |
| `tmdb`    | TMDB numeric id             |
| `s` / `e` | Season / episode (TV)       |
| `lang`    | ISO language (default `en`) |
| `sources` | Comma list or `all`         |
| `refresh` | `true` to bypass cache      |
| `type`    | `movie` \| `tv`             |

Response:

```json
{
	"results": [
		{
			"id": "…",
			"language": "en",
			"format": "vtt",
			"provider": "opensubtitles",
			"release": "…",
			"fileName": "…",
			"hearingImpaired": false,
			"downloadCount": 123,
			"downloadUrl": "/api/subtitles/…"
		}
	]
}
```

### `GET /api/subtitles/:id?format=vtt|srt`

Serves the cached subtitle file.

### `GET /api/sources`

Enabled providers and capabilities.

### `GET /api/status`

In-memory provider health (latency / last error).

## Providers (v1)

1. OpenSubtitles via [LavX opensubtitles-scraper](https://github.com/LavX/opensubtitles-scraper) (live `.org` HTML scrape; FlareSolverr sidecar)
2. Gestdown (TV API)
3. YIFY Subtitles (movies, scrape)
4. Subf2m (scrape)
5. TVSubtitles (TV, scrape)

Cache-first: recent titles refresh every 7 days; older titles stay until `refresh=true`.
Search stores **metadata only**; the subtitle body is downloaded lazily on first
`GET /api/subtitles/:id` and then cached in PocketBase.

## Env

| Variable                      | Purpose                                                 |
| ----------------------------- | ------------------------------------------------------- |
| `PUBLIC_POCKETBASE_URL`       | PocketBase URL (default `http://127.0.0.1:8093`)        |
| `TMDB_API_KEY`                | Resolve TMDB ↔ IMDb / titles                            |
| `OPENSUBTITLES_SCRAPER_URL`   | LavX scraper base URL (default `http://127.0.0.1:8000`) |
| `SUBDL_API_KEY`               | Optional SubDL API key (skipped when empty)             |
| `PB_ADMIN_EMAIL` / `PASSWORD` | Server-side PocketBase auth for cache writes            |

## Production (Docker)

Workflow [`.github/workflows/app-image.yml`](.github/workflows/app-image.yml) builds and pushes:

- `ghcr.io/<owner>/lumio-subs` — SvelteKit app (Bun)
- `ghcr.io/<owner>/lumio-subs-pocketbase` — PocketBase + migrations (no schema-generator hooks)

Triggers: push to the default branch touching app/PocketBase paths, or manual **workflow_dispatch**.

```bash
# on the host (private GHCR)
echo YOUR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

cp .env.example .env   # set TMDB_*, PB_ADMIN_*, ORIGIN, APP_IMAGE, POCKETBASE_IMAGE
docker compose -f docker-compose.prod.yml up -d
```

- App: http://127.0.0.1:3000 (or `APP_PORT`)
- PocketBase admin: http://127.0.0.1:8093 (or `PB_PORT`)

Set `ORIGIN` to the public HTTPS URL (or rely on `PROTOCOL_HEADER` / `HOST_HEADER` behind a reverse proxy). Inside the compose network the app talks to PocketBase at `http://pocketbase:8090` and the scraper at `http://opensubtitles-scraper:8000`.
