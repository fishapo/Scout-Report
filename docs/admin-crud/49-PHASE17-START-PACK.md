# Phase 17 Start Pack — Production Evidence Execution

## Objective
Execute the Phase 16 evidence framework in the real repository, CI, PostgreSQL, staging and production environments.

## Required actions
1. Run GitHub Actions on the exact release commit.
2. Confirm clean `npm ci` and the full test suite.
3. Confirm PostgreSQL integration.
4. Deploy and smoke-test staging.
5. Execute backup/restore and rollback drills.
6. Collect real 7-day and 30-day SLO data.
7. Generate the SLO report from supplied evidence using `npm run report:slo <file>`.
8. Generate the reliability review from supplied evidence using `npm run review:reliability <file>`.
9. Publish the incident/action register.
10. Approve the measured reliability/product roadmap.

## Exit criteria
- CI evidence retained.
- SLO report published from real monitoring data.
- Reliability review published.
- Incident/action register updated.
- DR and rollback evidence retained.
- Next roadmap approved.
