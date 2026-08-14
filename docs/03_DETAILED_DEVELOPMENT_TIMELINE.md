# Scout Report — Detailed Development Timeline & Release Plan

## Phase 28 — End-to-End Acceptance & Draft Semantics
**Duration:** 2–3 working days  
**Goal:** turn source-level confidence into executable acceptance evidence.

Tasks:
1. Establish clean Node/npm/PostgreSQL environment.
2. Run `npm ci`.
3. Run complete `npm test`.
4. Resolve any environment or genuine test failures.
5. Create controlled test users for all four roles.
6. Create a complete all-fields report.
7. Implement/confirm true draft Save semantics.
8. Test Save & Submit.
9. Test rejection/correction at Supervisor, HOD and Admin gates.
10. Verify audit events.

Exit criteria:
- Full test suite passes.
- All four workflow roles demonstrated.
- Draft and submit semantics unambiguous.
- Acceptance evidence stored.

## Phase 29 — Exchange & Reporting Acceptance
**Duration:** 2 working days

Tasks:
1. Test form CSV export.
2. Test form JSON export.
3. Test XLSX export.
4. Test XLSX import with valid data.
5. Test XLSX import with invalid data.
6. Verify row-level validation feedback.
7. Verify imported records enter draft workflow.
8. Test dashboard/admin printing.
9. Test browser PDF output.
10. Decide whether CSV/JSON should also be dashboard/server-level formats.

Exit criteria:
- All required exchange formats have explicit PASS/FAIL evidence.
- Invalid imports cannot bypass validation or verification.
- Print/PDF output is readable.

## Phase 30 — Analytics Acceptance
**Duration:** 2–3 working days

Tasks:
1. Create baseline reports across multiple farms/crops/dates.
2. Progress selected reports through workflow.
3. Verify KPI changes.
4. Verify crop/farm charts.
5. Verify monthly trend.
6. Verify workflow distribution.
7. Verify recent-report queue.
8. Verify role visibility.
9. Verify admin analytics.
10. Verify refresh behavior.

Exit criteria:
- Analytics reconcile with known test data.
- No unauthorized verification actions are possible.
- Shared analytics visibility is separated from verification authority.

## Phase 31 — Browser Automation & Regression
**Duration:** 3–4 working days

Tasks:
1. Add browser E2E framework.
2. Automate login.
3. Automate all-field form entry.
4. Automate Save.
5. Automate Save & Submit.
6. Automate Supervisor approval/rejection.
7. Automate HOD approval/rejection.
8. Automate Admin approval.
9. Automate import/export/print smoke tests.
10. Run regression against every release candidate.

Exit criteria:
- Critical user journeys are automated.
- E2E suite runs repeatably in CI/staging.

## Phase 32 — Security & Performance Gate
**Duration:** 2–3 working days

Tasks:
1. Authentication regression.
2. Authorization matrix.
3. Rate-limit verification.
4. Input validation review.
5. SQL/query review.
6. Analytics query/index review.
7. Large import performance test.
8. Concurrent dashboard load test.
9. Error logging and monitoring review.

Exit criteria:
- No unresolved P0 security defects.
- Performance baseline recorded.

## Phase 33 — Staging & Disaster Recovery
**Duration:** 2–3 working days

Tasks:
1. CI pipeline.
2. Staging deployment.
3. Smoke tests.
4. PostgreSQL backup.
5. Restore into isolated database.
6. Rollback drill.
7. Verify application/data consistency.

Exit criteria:
- Timestamped CI/staging/DR evidence.
- Backup restore proven.
- Rollback proven.

## Phase 34 — Production Release
**Duration:** 1–2 working days + observation

Tasks:
1. Final release candidate.
2. Production approval.
3. Controlled deployment.
4. Initial smoke test.
5. Monitor errors and workflow queues.
6. Review SLO/reliability metrics.
7. Capture post-release report.

Exit criteria:
- Production approval recorded.
- Observation window completed.
- No critical regression.

## Recommended overall schedule

| Phase | Duration | Priority |
|---|---:|---|
| 28 E2E + draft semantics | 2–3 days | P0 |
| 29 Exchange + printing | 2 days | P0 |
| 30 Analytics acceptance | 2–3 days | P0 |
| 31 Browser automation | 3–4 days | P1 |
| 32 Security/performance | 2–3 days | P1 |
| 33 Staging/DR | 2–3 days | P0 release gate |
| 34 Production release | 1–2 days + observation | P0 release gate |

**Estimated engineering effort:** 14–20 working days, depending on environment readiness and whether CSV/JSON dashboard-level exchange is required.
