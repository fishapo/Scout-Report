# Phase 13 Start Pack — Live Release Execution & Production Observability Drill

## Objective
Execute the Phase 12 pipeline in a real CI environment and validate the release operationally.

## Scope
1. Run GitHub Actions CI with PostgreSQL.
2. Confirm `npm ci` and full `npm test` are green.
3. Validate the release artifact checksum.
4. Promote to staging using a protected GitHub Environment.
5. Run HTTP/browser smoke tests against staging.
6. Validate `/api/health` and admin metrics.
7. Execute a backup and disposable restore drill.
8. Test rollback/promotion gates.
9. Validate alert thresholds and request correlation.
10. Produce final release evidence.

## Exit criteria
- CI green.
- Full test suite green.
- PostgreSQL integration green.
- Artifact checksum verified.
- Staging smoke tests green.
- DR restore evidence recorded.
- Production approval configured.
- Production observability confirmed.

## Constraint
Do not alter `/api/reference/*` response contracts without an explicit compatibility review.
