# Incident Response & Rollback Runbook

## Severity
- SEV-1: service unavailable, data loss/corruption or security compromise.
- SEV-2: major feature unavailable with workaround.
- SEV-3: limited degradation or operational defect.

## First 15 minutes
1. Confirm `/health` and `/api/health`.
2. Capture timestamp, deployment version and request IDs.
3. Check application and PostgreSQL logs.
4. Identify whether the issue is code, database, configuration or infrastructure.
5. Freeze unrelated changes.

## Rollback
1. Stop the affected deployment.
2. Revert to the last known-good release candidate.
3. Do not reverse database migrations blindly.
4. Restore database only when data integrity requires it and after an isolated restore check.
5. Re-run health and critical API checks.
6. Record the rollback and follow-up action.

## Security incident
Preserve logs and tokens/credentials only as incident evidence under the organization's secure incident process. Rotate compromised secrets and invalidate affected sessions.
