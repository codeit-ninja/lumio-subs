# syntax=docker/dockerfile:1

FROM oven/bun:1.2-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.2-alpine
WORKDIR /app

LABEL org.opencontainers.image.title="opensubtitles-mirror"
LABEL org.opencontainers.image.description="OpenSubtitles metadata + R2 download worker"

RUN apk add --no-cache curl

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock ./
COPY src ./src
COPY sql ./sql
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENTRYPOINT ["/entrypoint.sh"]
CMD ["worker"]
