# syntax=docker/dockerfile:1
# PocketBase with checked-in migrations only.
# Schema-generator hooks (pb_hooks → /pb_schema) are local/dev only — not shipped.

FROM ghcr.io/muchobien/pocketbase:latest

LABEL org.opencontainers.image.title="subrest-pocketbase"
LABEL org.opencontainers.image.description="PocketBase for SubREST (migrations)"

COPY pb_migrations /pb_migrations
