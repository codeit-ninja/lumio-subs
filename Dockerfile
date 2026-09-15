# syntax=docker/dockerfile:1
# Official @sveltejs/adapter-bun requires Bun 1.4+.

ARG BUN_VERSION=1.4

FROM oven/bun:${BUN_VERSION}-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ENV NODE_ENV=production
RUN bun run --bun build

FROM oven/bun:${BUN_VERSION}-alpine
WORKDIR /app

LABEL org.opencontainers.image.title="lumio-subs"
LABEL org.opencontainers.image.description="Lumio Subs — SvelteKit subtitle aggregator on Bun"

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/build ./build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
	CMD bun -e 'fetch("http://127.0.0.1:3000/api/status").then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'

CMD ["bun", "./build"]
