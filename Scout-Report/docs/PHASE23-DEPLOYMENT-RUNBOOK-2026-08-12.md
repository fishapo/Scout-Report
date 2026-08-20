# Scout Report — Phase 23 Deployment / Runbook

## 1. Prerequisites

- Node.js 18+
- npm 10.x compatible with the lockfile
- PostgreSQL 14+
- `.env` configured for the intended database
- Database user with permission to apply migrations

## 2. Install

```bash
cd finalbuild
npm ci --registry=https://registry.npmjs.org/
```

If Windows reports `ENOTEMPTY` or `EBUSY` during npm cleanup, stop Node processes first:

```bash
taskkill //F //IM node.exe 2>/dev/null || true
rm -rf node_modules
npm cache verify
npm ci --registry=https://registry.npmjs.org/
```

## 3. Configure database

Copy `.env.example` to `.env` and set the real Phase 23 PostgreSQL credentials.

Do not package `.env` into the release ZIP.

## 4. Apply database migrations

```bash
npm run migrate
```

Confirm the Phase 23 migration completes successfully and that `scout_reports.canonical_payload` and the new import provenance columns exist.

## 5. Static verification

```bash
npm run verify:phase20
npm run verify:phase22
npm run verify:master-import
npm run verify:phase23
```

## 6. Full regression / integration gate

```bash
RUN_DB_INTEGRATION=1 npm test
```

Release condition:

```text
fail 0
```

Skipped tests must be understood and explicitly accepted; a database integration skip is not equivalent to database verification.

## 7. Browser smoke test

1. Login.
2. Open the Scout Report form.
3. Confirm Farm contains FARM 1–11, FARM 12A, FARM 12B and GREENHOUSE.
4. Select Field, Greenhouse and Shadenet and confirm the compatibility flag only changes for Greenhouse.
5. Select a crop and confirm the variety list changes to the selected crop parent.
6. Enter environmental/GPS information.
7. Enter at least one pest/disease observation.
8. Save the report.
9. Confirm the report is persisted and enters the draft workflow.

## 8. Master workbook import

1. Upload the actual 38-column Clean Data workbook.
2. Stage/validate it.
3. Review accepted/rejected rows.
4. Commit only validated rows.
5. Confirm each committed row receives a PostgreSQL report ID.
6. Confirm `source_payload`, `normalized_payload`, `canonical_payload`, `source_row_number` and `canonical_report_id` are populated.
7. Export the source workbook from the batch and compare it with the staged source values.

## 9. Canonical exchange

Export:

`GET /api/reports/export-canonical.xlsx`

Import:

`POST /api/reports/import-canonical.xlsx`

The canonical exchange must contain all 93 dictionary fields.

## 10. Rollback

If Phase 23 deployment must be rolled back, do not delete source import provenance as part of an application rollback. Preserve the import batch and row audit records until the incident/change record is closed.

Use the existing `ops/rollback-runbook.md` for infrastructure rollback steps.

## 11. Production boundary

A successful local test suite is not production certification. Retain CI, staging, backup/restore, rollback and production observation evidence separately, consistent with the project's existing release-control policy.
