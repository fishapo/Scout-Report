# CI/CD and Release Pipeline

## Continuous Integration

`.github/workflows/ci.yml` performs a clean `npm ci`, starts PostgreSQL 16, applies the schema, runs every Phase 1–14 verification gate, executes the full test suite, runs the PostgreSQL-backed integration test, and creates a checksummed release artifact.

## Promotion

`.github/workflows/release.yml` is manually dispatched and uses GitHub Environments (`staging` or `production`). Required reviewers should be configured on those environments before production deployment is enabled.

For staging, `STAGING_BASE_URL` and `STAGING_ADMIN_TOKEN` may be supplied through GitHub Environment variables/secrets to run the HTTP smoke test automatically. The workflow still stops at an explicit deployment boundary until a real deployment target is configured.

## Release artifact

`npm run release:artifact` creates a ZIP excluding `.env`, `node_modules`, backups, logs and the release output itself, then writes a SHA-256 checksum alongside the archive.

## Phase 14 evidence

Use `docs/operations/PHASE14-LIVE-EVIDENCE.md` to record CI, staging, DR, rollback, SLO and production evidence. Source-level verification does not substitute for live infrastructure evidence.
