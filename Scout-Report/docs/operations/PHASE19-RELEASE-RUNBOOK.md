# Phase 19 — Operational Stabilization Release Runbook

1. Identify the exact release commit and artifact checksum.
2. Execute GitHub Actions CI and retain the run URL and artifacts.
3. Confirm clean `npm ci`, Phase 1–19 gates, full `npm test`, and PostgreSQL integration.
4. Promote to staging through the protected environment.
5. Run `npm run smoke:staging` with the approved staging credentials.
6. Verify health, auth, Scout reference APIs, Scout Form, Admin Dashboard, admin metrics and request correlation.
7. Create a PostgreSQL backup and record its checksum.
8. Restore the backup into a disposable database and verify data integrity.
9. Execute the controlled rollback drill using the known-good artifact.
10. Record post-rollback health and smoke evidence.
11. Promote to production only after the protected approval boundary is satisfied.
12. Record 15-minute and 1-hour observations.
13. Generate the first measured SLO report and reliability review from supplied evidence files.
14. Update the incident/action register with any observed issue.
15. Begin the 7-day and 30-day reliability review cycle.

Never replace an unavailable measurement with an assumption.
