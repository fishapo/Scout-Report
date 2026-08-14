#!/usr/bin/env bash
set -euo pipefail
: "${RESTORE_DB:?RESTORE_DB is required}"
: "${DB_USER:?DB_USER is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"
: "${DB_HOST:=localhost}"
: "${DB_PORT:=5432}"
export PGPASSWORD="$DB_PASSWORD"
pg_restore --clean --if-exists --no-owner --no-acl -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$RESTORE_DB" "$BACKUP_FILE"
unset PGPASSWORD
echo "Restore completed into disposable database: $RESTORE_DB"
