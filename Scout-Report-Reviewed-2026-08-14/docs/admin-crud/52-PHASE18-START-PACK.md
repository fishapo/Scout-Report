# Phase 18 Start Pack — External Staging & Production Execution

## Objective
Execute the already-established release/evidence framework against real GitHub Actions, staging and production infrastructure.

## Gates
- GitHub Actions clean `npm ci`.
- Phase 1–17 verification gates.
- Full `npm test`.
- PostgreSQL integration.
- Release artifact checksum.
- Staging health/reference/admin metrics smoke.
- Scout Form regression.
- Admin Dashboard regression.
- Backup and disposable-database restore verification.
- Controlled rollback verification.
- Production approval boundary.
- Post-deployment observation window.

## Evidence rule
Every operational result must identify the run, timestamp, environment and artifact/release identity. Blank or pending fields are not passes.

## Product constraint
Do not alter the Scout-facing `/api/reference/*` response contract during deployment hardening. Admin reference CRUD remains under `/api/admin/reference/*`.
