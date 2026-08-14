# Phase 18 — Local Acceptance Evidence — 2026-08-10

## Evidence source
Operator-supplied Windows Git Bash runtime evidence from `Z:\Scout-Report\02` is recorded here. The server selected an available port because port 3000 was occupied and served the application on `http://localhost:3003`.

## Browser/runtime path
Observed sequence:

- `GET /` → **200**
- `GET /assets/auth.js` → **200**
- unauthenticated `GET /auth/me` → **401** (expected)
- `POST /auth/login` → **200**
- authenticated `GET /dashboard` → **302**
- authenticated `GET /admin-dashboard.html` → **200**
- authenticated `GET /auth/me` → **200**
- `GET /favicon.ico` → **404** (non-blocking browser asset miss)

## PostgreSQL-backed application evidence
Observed successful PostgreSQL-backed requests:

- `/api/reference/farms` → **200**
- `/api/reference/crop-types` → **200**
- `/api/reference/pests` → **200**
- `/api/reference/diseases` → **200**
- `/api/reports/stats` → **200**
- `/api/reports` → **200**
- admin crop types → **200**
- admin farms → **200**
- admin pests → **200**
- admin diseases → **200**
- nested crop variety routes → **200**

The server log also records successful PostgreSQL connection and authenticated session lookups/updates.

## Interpretation
This proves a useful **local runtime acceptance slice**: login, session restoration, browser routing, admin dashboard delivery, reference APIs, report statistics and admin reference reads were observed working against PostgreSQL.

It does **not** prove GitHub Actions execution, externally deployed staging, production approval, backup/restore, rollback, or production SLO performance.
