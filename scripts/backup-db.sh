#!/usr/bin/env bash
# Manual database backup via Supabase CLI.
# Requires: SUPABASE_DB_URL env var (postgres://... connection string from Supabase dashboard)
# Usage: bash scripts/backup-db.sh

set -euo pipefail

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "ERROR: SUPABASE_DB_URL is not set."
  echo "  Get it from: Supabase Dashboard → Project Settings → Database → Connection String (URI mode)"
  exit 1
fi

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
OUTPUT_DIR="${BACKUP_DIR:-./backups}"
FILENAME="dfs-backup-${TIMESTAMP}.sql"
FILEPATH="${OUTPUT_DIR}/${FILENAME}"

mkdir -p "$OUTPUT_DIR"

echo "Backing up database to ${FILEPATH}..."
pg_dump "$SUPABASE_DB_URL" \
  --no-owner \
  --no-acl \
  --schema=public \
  --format=plain \
  --file="$FILEPATH"

gzip "$FILEPATH"
echo "Backup saved: ${FILEPATH}.gz ($(du -h "${FILEPATH}.gz" | cut -f1))"

# TODO: Add Google Drive upload here
# gdrive upload "${FILEPATH}.gz" --parent FOLDER_ID
