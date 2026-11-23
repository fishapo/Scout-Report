# Phase 22 Implementation Index

| Area | Implementation |
|---|---|
| Canonical report extensions | `server/controllers/report-extension.controller.js` |
| Repeatable observations | `server/canonical-observations.js` |
| Observation API | `server/routes/canonical-observations.routes.js` |
| Full report API | `GET /api/reports/:id/full` |
| Verification checklist | `server/verification-checklist.js` |
| Checklist API | `server/routes/verification-checklist.routes.js` |
| Approval enforcement | `server/workflow.store.js` |
| Database | `server/migrations/005_phase22_verification_checklists.sql` |
| Form contract | `server/form-config/scout-report.sections.json` |
| Static gate | `scripts/verify-phase22.js` |
| Contract tests | `server/phase22.contract.test.js` |
