# Phase 19 — Local Acceptance Evidence — 2026-08-10

## Source
Operator-supplied Windows Git Bash runtime evidence from `Z:\Scout-Report\02`.

## Observed local runtime
- Application served at `http://localhost:3003` after automatic selection because port 3000 was busy.
- `GET /` → **200**
- unauthenticated `GET /auth/me` → **401** (expected)
- `POST /auth/login` → **200**
- authenticated `GET /dashboard` → **302**
- authenticated `GET /admin-dashboard.html` → **200**
- authenticated `GET /auth/me` → **200**
- PostgreSQL connection → **connected**
- Reference APIs and report statistics → **200** observed
- Admin reference routes and nested variety routes → **200** observed

## Dependency/runtime preparation
- `rm -rf node_modules` → executed
- `npm cache verify` → successful
- `npm ci --registry=https://registry.npmjs.org/` → **115 packages installed**
- Express → **4.22.2**
- dotenv → **16.4.7**
- pg → **8.22.0**
- `npm run verify:phase17` → **55/55 PASS**

## Evidence boundary
This is local operator evidence. It does not certify external CI, staging, production approval, backup/restore, rollback, or production SLO measurements.
