# Phase 18 Release Runbook

## 1. Preconditions
1. Push the intended release commit to the repository.
2. Confirm GitHub Environment protection rules and required reviewers.
3. Confirm staging database credentials and application secrets are configured outside source control.
4. Confirm `STAGING_BASE_URL` and `STAGING_ADMIN_TOKEN` are available to the release workflow.
5. Confirm a known-good previous artifact exists for rollback.

## 2. CI gate
Run the CI workflow and require:
- clean `npm ci`
- Phase 1–18 verification gates
- full `npm test`
- PostgreSQL integration
- release artifact build
- artifact SHA-256 verification

Record the run URL, commit SHA and artifact checksum.

## 3. Staging
Run the release workflow with `environment=staging`.

Run `npm run smoke:staging` against the real staging URL. Verify:
- root/login entry
- API health
- public Scout reference API
- protected dashboard
- unauthenticated admin metrics rejection
- authenticated admin metrics
- request correlation header
- Scout Form
- Admin Dashboard

Record timestamp and result for every gate.

## 4. Backup and restore
1. Execute `scripts/backup-postgres.sh` against the staging database.
2. Record backup filename and SHA-256.
3. Create a disposable restore database.
4. Execute `scripts/restore-postgres.sh` into the disposable database.
5. Verify schema and representative reference/report/auth records.
6. Record restore duration and result.

## 5. Rollback drill
1. Identify the known-good artifact.
2. Deploy the candidate to a disposable or controlled slot.
3. Trigger rollback to the known-good artifact.
4. Re-run health and smoke checks.
5. Record rollback duration and final state.

## 6. Production
Production promotion requires the protected GitHub Environment approval. Do not bypass reviewers.

After deployment, record:
- deployment timestamp
- artifact checksum
- health result
- smoke result
- 15-minute observation
- 1-hour observation

## 7. SLO/reliability review
Feed only measured values into the SLO and reliability generators. Do not replace missing measurements with estimates.
