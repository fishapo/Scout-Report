#!/usr/bin/env bash
set -euo pipefail
: "${DB_USER:?DB_USER is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${DB_HOST:=localhost}"
: "${DB_PORT:=5432}"
: "${DB_NAME:=scout_report}"
OUT_DIR="${BACKUP_DIR:-backups}"
mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
export PGPASSWORD="$DB_PASSWORD"
pg_dump -Fc -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$OUT_DIR/scout_report_${STAMP}.dump"
unset PGPASSWORD
echo "Backup created: $OUT_DIR/scout_report_${STAMP}.dump"
