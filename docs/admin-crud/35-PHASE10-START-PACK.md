# Phase 10 Start Pack — Final Runtime Acceptance & Release Candidate

## Objective

Close the remaining environment-gated acceptance from Phase 9 and produce the first release candidate.

## Required environment

- Node.js compatible with the project engine.
- npm matching the pinned package manager (`npm@10.9.2`) or a deliberately documented newer compatible npm.
- PostgreSQL 16+ or the supplied Docker Compose PostgreSQL service.

## Gate sequence

1. `npm ci`
2. `npm run verify:phase9`
3. `docker compose up -d postgres` (or equivalent PostgreSQL setup)
4. Confirm database readiness.
5. Apply/confirm `server/migrations/init.sql`.
6. Configure secure `.env` values.
7. `npm test`
8. `npm run verify:ui`
9. Start the API.
10. Verify `/api/health` returns healthy/connected.
11. Register controlled admin and scout users.
12. Verify admin-only CRUD for Farms, Crop Types, Varieties, Pests and Diseases.
13. Verify Scout Form reference reads remain compatible.
14. Verify authorization, session expiry, rate limiting and production security headers.
15. Record exact Node/npm/PostgreSQL versions and final test counts.
16. Package the release candidate.

## Exit criteria

- Clean `npm ci` succeeds.
- Phase 1–9 verification remains green.
- Full `npm test` is green.
- PostgreSQL integration is green.
- Browser acceptance is green.
- No public reference API regression.
- No destructive historical-data regression.
- Production configuration contains no development secrets.
- Release notes and deployment runbook are complete.
