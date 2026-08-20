# Phase 18 — Live Evidence Record

## Status
**ENGINEERING + LOCAL ACCEPTANCE COMPLETE; EXTERNAL INFRASTRUCTURE EXECUTION PENDING**

Phase 18 establishes and verifies the executable release/staging/DR/rollback gates. This document intentionally separates locally observed runtime evidence from evidence that must come from GitHub Actions, a real staging target, and an approved production environment.

## Release identity
- Release commit: **PENDING — populate from GitHub Actions run**
- Artifact filename: **PENDING — populate from release run**
- Artifact SHA-256: **PENDING — populate from release run**
- GitHub Actions run URL: **PENDING**

## Local runtime evidence supplied by operator
- Runtime target: `http://localhost:3003`
- `GET /`: **200**
- `GET /assets/auth.js`: **200**
- `POST /auth/login`: **200**
- Authenticated `GET /dashboard`: **302** to admin dashboard
- Authenticated `GET /admin-dashboard.html`: **200**
- Authenticated `GET /auth/me`: **200**
- `GET /api/reference/farms`: **200**
- `GET /api/reference/crop-types`: **200**
- `GET /api/reference/pests`: **200**
- `GET /api/reference/diseases`: **200**
- Authenticated `GET /api/reports/stats`: **200**
- Authenticated admin reference routes: **200** observed
- PostgreSQL connection: **connected**

This is local operator evidence, not external staging or production certification.

## CI
- Exact CI run URL: **PENDING**
- Clean `npm ci`: **PENDING CI evidence**
- Phase 1–18 gates: **PENDING CI execution**
- Full `npm test`: **PENDING CI execution**
- PostgreSQL integration: **PENDING CI execution**
- Release artifact/checksum: **PENDING CI execution**

## Staging
- Staging URL: **PENDING**
- `/api/health`: **PENDING**
- `/health`: **PENDING**
- `/`: **PENDING**
- `/login`: **PENDING**
- `/api/reference/farms`: **PENDING**
- Protected `/dashboard`: **PENDING**
- Admin metrics unauthorized: **PENDING**
- Admin metrics authorized: **PENDING**
- `x-request-id`: **PENDING**
- Scout Form regression: **PENDING**
- Admin Dashboard regression: **PENDING**

## Disaster recovery
- Backup artifact/checksum: **PENDING**
- Disposable restore database: **PENDING**
- Restore result: **PENDING**
- Data-integrity verification after restore: **PENDING**

## Rollback
- Known-good artifact: **PENDING**
- Rollback execution: **PENDING**
- Post-rollback health: **PENDING**
- Post-rollback smoke: **PENDING**

## Production
- Environment approval: **PENDING**
- Deployment timestamp: **PENDING**
- Deployed artifact checksum: **PENDING**
- Health verification: **PENDING**
- 15-minute observation: **PENDING**
- 1-hour observation: **PENDING**

## SLO / reliability
- First measured availability window: **PENDING**
- p95 latency: **PENDING**
- 5xx/error rate: **PENDING**
- Incident count: **PENDING**
- Reliability review: **PENDING**

> Pending evidence is not a pass. No production, staging, CI, DR, rollback, or SLO result is certified until the corresponding external execution is recorded with run identity, timestamp, environment, and artifact identity.
