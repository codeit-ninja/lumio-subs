# syntax=docker/dockerfile:1
# PocketBase with checked-in migrations + schema-generator hooks baked in.

FROM ghcr.io/muchobien/pocketbase:latest

LABEL org.opencontainers.image.title="lumio-subs-pocketbase"
LABEL org.opencontainers.image.description="PocketBase for Lumio Subs (migrations + hooks)"

COPY pb_migrations /pb_migrations
COPY pb_hooks /pb_hooks
