#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

curl_json() {
  curl -fsS -H "Accept: application/json" "$1"
}

status_code() {
  curl -sS -o /dev/null -w '%{http_code}' "$1"
}

printf 'Smoke target: %s\n' "$BASE_URL"
printf '1) root login entry\n'
root_status="$(status_code "$BASE_URL/")"
[[ "$root_status" == "200" || "$root_status" == "302" ]]
printf '2) /login\n'
[[ "$(status_code "$BASE_URL/login")" == "200" ]]
printf '3) /api/health\n'
curl_json "$BASE_URL/api/health" >/dev/null
printf '4) /health\n'
curl_json "$BASE_URL/health" >/dev/null
printf '5) /api/reference/farms\n'
curl_json "$BASE_URL/api/reference/farms" >/dev/null
printf '6) protected /dashboard\n'
dashboard_status="$(status_code "$BASE_URL/dashboard")"
[[ "$dashboard_status" == "302" || "$dashboard_status" == "401" || "$dashboard_status" == "403" ]]
printf '7) /api/admin/metrics requires auth\n'
status="$(status_code "$BASE_URL/api/admin/metrics")"
[[ "$status" == "401" || "$status" == "403" ]]

if [[ -n "$ADMIN_TOKEN" ]]; then
  printf '8) authenticated admin metrics\n'
  curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" -H "Accept: application/json" "$BASE_URL/api/admin/metrics" >/dev/null
fi

printf '9) request correlation\n'
headers="$(curl -sSI "$BASE_URL/api/health")"
grep -qi '^x-request-id:' <<<"$headers"
printf 'STAGING SMOKE PASS\n'
