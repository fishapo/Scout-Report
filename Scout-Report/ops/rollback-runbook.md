# Production Rollback Runbook

## Trigger

Rollback when a deployment causes sustained 5xx errors, database incompatibility, authentication failure, broken Scout Form behavior, or another release-blocking regression.

## Procedure

1. Freeze further promotion.
2. Record the current commit, release artifact and first failing request IDs.
3. Confirm `/api/health` and the affected endpoint.
4. Select the last known-good release artifact.
5. Restore application version through the protected deployment mechanism.
6. If a database migration is involved, follow the migration-specific recovery procedure; never improvise destructive SQL during an incident.
7. Run `npm run smoke:staging` or the production equivalent against the recovered service.
8. Verify `/api/reference/farms`, authentication, admin metrics and Scout Form behavior.
9. Confirm SLO indicators return to normal.
10. Record the rollback evidence and open a post-incident review.

## Abort conditions

Stop the rollback and escalate if the last known-good artifact cannot be verified, the database state is incompatible, or restore evidence is incomplete.
