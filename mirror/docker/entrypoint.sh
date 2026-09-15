#!/bin/sh
set -eu

cmd="${1:-worker}"
shift || true

case "$cmd" in
	worker)
		echo "Applying database migrations..."
		bun run src/jobs/db-init.ts
		if [ "${IMPORT_METADATA_ON_START:-}" = "true" ] || [ "${IMPORT_METADATA_ON_START:-}" = "1" ]; then
			echo "IMPORT_METADATA_ON_START set — importing metadata dump..."
			bun run src/jobs/import-metadata.ts
		fi
		echo "Starting download worker..."
		exec bun run src/jobs/download-worker.ts "$@"
		;;
	import-metadata)
		echo "Applying database migrations..."
		bun run src/jobs/db-init.ts
		echo "Importing metadata dump..."
		# Fail the container clearly if download/import blows up (Dockhand shows exited + logs)
		bun run src/jobs/import-metadata.ts "$@"
		echo "Metadata import finished successfully."
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
