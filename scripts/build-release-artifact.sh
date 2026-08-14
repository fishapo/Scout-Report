#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT}/release"
NAME="scout-report-${GITHUB_SHA:-local}"
mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR/${NAME}.zip" "$OUT_DIR/${NAME}.zip.sha256"

cd "$ROOT"
zip -qr "$OUT_DIR/${NAME}.zip" . \
  -x './node_modules/*' './release/*' './.git/*' './.env' './backups/*' './*.log'
sha256sum "$OUT_DIR/${NAME}.zip" > "$OUT_DIR/${NAME}.zip.sha256"
printf 'Release artifact: %s\nChecksum: %s\n' "$OUT_DIR/${NAME}.zip" "$OUT_DIR/${NAME}.zip.sha256"
