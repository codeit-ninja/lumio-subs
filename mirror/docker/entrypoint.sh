#!/bin/sh
set -eu

cmd="${1:-worker}"
shift || true

case "$cmd" in
	worker)
		echo "Applying database migrations..."
		bun run src/jobs/db-init.ts
		echo "Starting download worker..."
		exec bun run src/jobs/download-worker.ts "$@"
		;;
	import-metadata)
		bun run src/jobs/db-init.ts
		exec bun run src/jobs/import-metadata.ts "$@"
		;;
	status)
		exec bun run src/jobs/status.ts "$@"
		;;
	db-init)
		exec bun run src/jobs/db-init.ts "$@"
		;;
	*)
		exec "$cmd" "$@"
		;;
esac
