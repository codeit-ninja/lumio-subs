# SubREST

Standalone subtitle aggregator: multi-provider search, permanent PocketBase + R2 storage, JSON API.

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

Errors on `/api/*` always return JSON:

```json
{ "error": { "code": "SEARCH_INVALID", "message": "…" } }
```

### `GET /api/search`

| Param     | Description                                    |
| --------- | ---------------------------------------------- |
| `imdb`    | IMDb id (`tt…`) — preferred                    |
| `tmdb`    | TMDB numeric id                                |
| `s` / `e` | Season / episode (TV)                          |
| `lang`    | ISO language (default `en`)                    |
| `sources` | Comma list or `all`                            |
| `refresh` | `true` to re-scrape and replace stored results |
| `type`    | `movie` \| `tv`                                |

Response:

```json
{
	"results": [
		{
			"id": "…",
			"language": "en",
			"format": "vtt",
			"release": "…",
			"fileName": "…",
			"downloadUrl": "https://…r2.cloudflarestorage.com/bucket/…/….vtt"
		}
	]
}
```

`downloadUrl` is a direct R2 object URL once the subtitle file is stored in PocketBase (S3/R2 backend). Until then it is `/api/subtitles/:id`.

Search returns stored rows from the database when present. On a miss (or `refresh=true`), providers are scraped, files are downloaded and stored permanently, then results are returned.

### `GET /api/subtitles/:id?format=vtt|srt`

Serves a stored subtitle: **302** to the R2 URL for `format=vtt` (default). `format=srt` streams a converted body from the stored VTT. If a row is missing its file, the provider is used once as a fallback warm path.

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

Permanent store: search misses scrape providers, download files eagerly, and save metadata + VTT
in PocketBase/R2. Existing rows are returned as-is until `refresh=true` replaces them.

## Env

| Variable                      | Purpose                                                  |
| ----------------------------- | -------------------------------------------------------- |
| `PUBLIC_POCKETBASE_URL`       | PocketBase URL (default `http://127.0.0.1:8093`)         |
| `TMDB_API_KEY`                | Resolve TMDB ↔ IMDb / titles                             |
| `OPENSUBTITLES_SCRAPER_URL`   | LavX scraper base URL (default `http://127.0.0.1:8000`)  |
| `SUBDL_API_KEY`               | Optional SubDL API key (skipped when empty)              |
| `PB_ADMIN_EMAIL` / `PASSWORD` | Server-side PocketBase auth for subtitle writes          |
| `CLOUDFLARE_R2_ENDPOINT`      | R2 S3 API base used to build public `downloadUrl`s       |
| `CLOUDFLARE_R2_BUCKET`        | Bucket name (must allow anonymous GET on PB object keys) |

Configure PocketBase Admin → **Settings → Files storage** to use the same R2 bucket. Public object URLs are:

`{CLOUDFLARE_R2_ENDPOINT}/{CLOUDFLARE_R2_BUCKET}/{collectionId}/{recordId}/{fileName}`

## Auth (email login)

End-user accounts use PocketBase `users` with **email verification required before login** (`authRule: verified = true`).

1. Header **Login** → `/login` (login + register tabs)
2. Register creates an unverified user and the app sends a branded verification email ([better-svelte-email](https://github.com/Konixy/better-svelte-email))
3. User opens `/verify?token=…` → account becomes usable
4. Login sets an HTTP-only `pb_auth` cookie

### SMTP (app outbound)

Verification mail is sent by the **SvelteKit app** (not PocketBase templates). Configure env:

| Variable                   | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| `SMTP_HOST`                | e.g. `smtp.mx.cloudflare.net`              |
| `SMTP_PORT`                | `465` (TLS) or `587`                       |
| `SMTP_USER` / `PASSWORD`   | SMTP credentials                           |
| `SMTP_FROM`                | e.g. `SubREST <noreply@your-domain>`       |
| `AUTH_VERIFICATION_SECRET` | HMAC secret for verify links (long random) |

`SMTP_FROM` must use a domain you’re allowed to send from (SPF/DKIM on Cloudflare DNS).

### Email preview

Templates live in `src/lib/emails/`. Preview with [@better-svelte-email/cli](https://github.com/Konixy/better-svelte-email):

```bash
bun run email:dev
```

Open http://127.0.0.1:3020 — edits to templates hot-reload.

### Local / docker

Restart PocketBase after pulling so migration `1740000200_users_email_verification.js` applies (`authRule`). Without SMTP env, registration still creates the user but sending the verification email will fail until mail is configured.

## Production (Docker)

Workflow [`.github/workflows/app-image.yml`](.github/workflows/app-image.yml) builds and pushes:

- `ghcr.io/<owner>/subrest` — SvelteKit app (Bun)
- `ghcr.io/<owner>/subrest-pocketbase` — PocketBase + migrations (no schema-generator hooks)

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
