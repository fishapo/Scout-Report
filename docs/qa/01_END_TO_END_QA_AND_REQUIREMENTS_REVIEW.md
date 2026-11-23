# Scout Report — End-to-End QA & Requirements Review
**Review date:** 14 August 2026  
**Reviewed baseline:** `Scout-Report-Phase27-MIGRATION-FIX-2026-08-13.zip`  
**Purpose:** Verify the complete user journey requested: comprehensive form entry → save/save & submit → export/import → print → workflow sharing → admin analytics, then identify gaps and produce the next development plan.

## 1. Executive result

The current baseline is **functionally strong at source-code level**, but it is **not yet a production-certified end-to-end build** because the local environment used for this review could not run the complete dependency-backed test suite.

The source already contains:
- a comprehensive master-aligned scout form;
- Save Report and Save & Submit Report controls;
- CSV and JSON form-level export;
- XLSX dashboard/admin import/export;
- print controls and print styles;
- four-role sequential verification;
- shared analytics and an administrator analytics workspace;
- workflow audit/event infrastructure.

The most important functional issue found during this review is the distinction between **Save Report** and **Save & Submit Report**: both currently call the same `submitReport()` implementation. If “Save” is intended to create a draft without forwarding it, this needs correction.

## 2. Evidence-backed requirements

The management walkthrough states that every authenticated role can use the shared analytics dashboard and create a report, while verification authority remains role-specific. It defines the mandatory chain Scout → Inter-Farm Supervisor → Head of Department → Administrator → Approved, with rejection returning to the previous stage and each transition recorded as an audit event. 

The same documentation identifies dashboard KPIs, reports by crop/farm, monthly trend, workflow distribution, users by role, recent reports, automatic refresh, XLSX import/export and browser printing as required capabilities.

## 3. Requested test journey

### A. Create a new report with all fields

**Result: PASS at source-test level / E2E blocked.**

The current alignment tests passed:
- 13/13 focused tests passed;
- 38 master spreadsheet/database keys are checked against the form;
- the canonical dictionary is checked at 93 fields;
- farm/location controls, environment/GPS controls, nested crop/variety selection, pest/disease references and form submission mapping are covered.

**Manual browser test to execute in the operator environment**
1. Login as Scout.
2. Open New Report.
3. Populate every visible field, including optional/conditional fields.
4. Test Field vs Greenhouse location behavior.
5. Select a crop and verify dependent variety options.
6. Add pest, disease and other-condition observations.
7. Capture GPS/environment values where applicable.
8. Verify no required-field validation is bypassed.
9. Save.
10. Re-open the report and verify persistence.
11. Save & Submit and verify it enters the next workflow stage.

### B. Save vs Save & Submit

**Result: REVIEW REQUIRED.**

The form exposes:
- `Save Report`
- `Save & Submit Report`

However, the implementation defines `saveReportOnly()` as a direct call to `submitReport()`. Therefore, the two buttons currently share the same submission path.

**Required decision:**  
If Save means “persist as draft”, implement a true draft-only operation and keep Save & Submit as the workflow-forwarding operation. If both are intentionally equivalent, rename/remove the duplicate action to avoid user confusion.

### C. CSV export

**Result: PASS — form-level export.**

The scout form contains a CSV generator that creates `scout-report-master-row.csv` from the current master-row payload.

**Recommended enhancement:** add a dashboard-level CSV export of filtered report results if management expects CSV as a general report exchange format. Current dashboard exchange is XLSX.

### D. JSON export

**Result: PASS — form-level export.**

The scout form creates `scout-report.json` containing the report payload and master-row representation.

**Recommended enhancement:** add a server-backed authenticated JSON export endpoint for reproducible management/API exchange, if JSON is intended to be a formal system export rather than a browser convenience.

### E. XLSX import/export

**Result: PASS at source level / E2E blocked.**

Dashboard/admin UI expose Export Excel and Import Excel. The server contains dedicated import routes/services, XLSX handling and validation.

The documented design is correct: imported rows become drafts owned by the importing user and cannot bypass verification.

### F. Print

**Result: PASS at source level.**

The dashboard and administrator dashboard include browser print controls and dedicated print CSS. The form also exposes print functionality.

### G. User → workflow sharing → Admin → analytics

**Result: PASS at architecture/source level / E2E blocked.**

The workflow model is:

`Scout → Inter-Farm Supervisor → Head of Department → Administrator → Approved`

Expected behavior:
- Scout creates/submits.
- Supervisor reviews and approves/rejects.
- HOD reviews supervisor-approved reports and approves/rejects.
- Admin performs final verification.
- Rejection returns to the previous stage.
- Each transition creates an audit event.

The analytics layer is designed to expose total/critical/pending/completed reports, crop/farm distributions, monthly trend, workflow distribution, users by role and recent reports.

**Important clarification:** “share to admin for analytics” should not mean a Scout can directly bypass Supervisor/HOD verification. Admin analytics visibility is separate from Admin verification authority.

## 4. Full project requirement review

| Area | Status | Assessment |
|---|---|---|
| Authentication | PASS* | Implemented and covered by existing tests; full runtime regression blocked in this environment |
| Role authorization | PASS* | Four-role server-side authorization is present |
| Comprehensive scout form | PASS* | Master-alignment tests 13/13 pass |
| Farm/crop/variety references | PASS* | Master/reference tests pass |
| Pest/disease/other conditions | PASS* | Source and form coverage present |
| Save draft semantics | REVIEW | Save and Save & Submit currently share implementation |
| Submit workflow | PASS* | Workflow routes/services/tests present |
| Sequential verification | PASS* | Scout → Supervisor → HOD → Admin |
| Rejection/correction | PASS* | Previous-stage return model present |
| Audit trail | PASS* | Workflow events are part of the architecture |
| Shared dashboard | PASS* | KPIs/charts/recent reports present |
| Admin analytics | PASS* | Analytics + governance workspace present |
| XLSX export | PASS* | UI + server implementation present |
| XLSX import | PASS* | Validation/staging/workflow-safe import present |
| CSV export | PASS | Form-level |
| JSON export | PASS | Form-level |
| CSV import | GAP | Not identified as a dashboard/server exchange feature |
| JSON import | GAP | Not identified as a dashboard/server exchange feature |
| Print | PASS* | Browser print + print CSS |
| User management | PASS* | Admin-only controls and safeguards present |
| Reference-data CRUD | PASS* | Farms/crops/varieties/pests/diseases |
| Production CI/staging | PENDING | Requires external execution |
| Backup/restore | PENDING | Requires operational drill |
| Rollback | PENDING | Requires operational drill |
| Production approval/SLO | PENDING | Requires operational evidence |

`*` = source-level evidence; requires full environment-backed execution for final acceptance.

## 5. Current test evidence

Focused master/form alignment:
- **13 tests passed**
- **0 failed**
- **0 skipped**

The full `npm test` attempt was **blocked before test execution** because the environment reported missing runtime dependencies (`express`, `dotenv`, `pg`, `cookie-parser`, `cors`). The attempted dependency installation was not successfully completed in the mounted review environment.

This is an environment/test-execution limitation, not evidence that the application tests themselves fail.

## 6. Acceptance test script for operator environment

Run from the project root:

```bash
npm ci
npm test
npm run verify:latest-form
npm run verify:phase26
```

Then perform browser E2E:

1. Login as Scout.
2. Create a fully populated report.
3. Save as draft and verify it remains draft.
4. Export CSV.
5. Export JSON.
6. Print the form.
7. Save & Submit.
8. Login as Inter-Farm Supervisor.
9. Review and approve.
10. Login as HOD.
11. Review and approve.
12. Login as Admin.
13. Verify the report is visible in the admin queue.
14. Final-approve the report.
15. Refresh shared analytics.
16. Verify KPI totals changed.
17. Verify crop/farm/month/workflow analytics changed.
18. Export XLSX.
19. Re-import a test XLSX and verify it becomes a draft.
20. Print dashboard and save as PDF.
21. Test rejection at each stage and confirm return-to-previous-stage behavior.
22. Confirm audit history records every transition.

## 7. Priority defects / improvements

### P0 — resolve before sign-off
1. Define and implement true draft Save semantics if required.
2. Execute complete `npm ci && npm test` in a clean operator environment.
3. Execute the complete browser workflow against PostgreSQL.
4. Record timestamped evidence for CI/staging/backup/restore/rollback.

### P1 — next development cycle
1. Add automated browser E2E tests for the complete four-role lifecycle.
2. Add regression tests for Save vs Save & Submit semantics.
3. Add dashboard CSV export if CSV is a formal management requirement.
4. Add server-backed JSON export if JSON is a formal integration requirement.
5. Add import preview/dry-run UI with row-level errors and commit confirmation.
6. Add analytics filters for date, farm, crop, scout and workflow stage.
7. Add downloadable analytics report packs.

### P2 — operational maturity
1. Offline/mobile resilience.
2. Evidence/media attachment workflow.
3. Advanced diagnostics and samples.
4. Performance/SLO monitoring.
5. Backup automation and restore verification.
6. Release rollback automation.

## 8. Final review conclusion

**Recommendation: continue to controlled verification, not redesign.**

The baseline already contains the major functional architecture. The next work should focus on proving the existing behavior end-to-end, correcting the Save/draft semantic ambiguity, expanding automated UI coverage, and completing operational release gates.
