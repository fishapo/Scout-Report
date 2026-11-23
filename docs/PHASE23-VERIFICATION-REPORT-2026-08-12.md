# Scout Report — Phase 23 Verification Report

**Date:** 12 August 2026  
**Milestone:** Phase 23 — Spreadsheet → Canonical Report → PostgreSQL commit path

## 1. Objective

Phase 23 closes the data path:

**Collect → Inventory → Map → Approve → Code → Import → Form → Save → Review → Export**

The implementation is based on the actual `Combined-Scout-Report-Master-ver_21-2026.xlsx` included in the release tree.

## 2. Source workbook verification

The application copy is:

`docs/phase22-master-import/source/Combined-Scout-Report-Master-ver_21-2026.xlsx`

The workbook parser reports **31,890 rows** and **38 columns** on the `Clean Data` worksheet.

The exact 38 headings are verified against `docs/phase22-master-import/master-import-schema.json` and are treated as the source contract rather than silently renamed.

## 3. Canonical dictionary

The approved canonical dictionary contains **93 fields**. The Phase 23 canonical XLSX helper uses the dictionary itself as the export/import header contract, so the 93-field round trip does not depend on a second hand-maintained header list.

## 4. Form alignment

The Scout Report form retains:

- FARM 1–FARM 11
- FARM 12A
- FARM 12B
- GREENHOUSE
- Field
- Greenhouse
- Shadenet
- Crop → Variety dependent reference selection
- Weather, temperature and humidity
- GPS/location capture
- Pest and disease observations
- 38 source/master observation controls

`isGreenhouse` is now explicitly a compatibility flag derived from the production-area selector: **true only for Greenhouse**. Field and Shadenet remain false and the selected mode is also retained in the source/master observation payload.

## 5. Save path

`saveReport()` now persists a `canonical_payload` JSONB snapshot containing exactly the 93 canonical fields while continuing to persist the existing report header, master observations and repeatable pest/disease records.

The existing workflow remains separate from report-health status. New reports continue through the draft workflow and report-health status is still derived from observations.

## 6. Master import commit path

Master workbook staging already retained the complete original source row in `report_import_rows.source_payload`. Phase 23 extends that path with:

1. staging and validation;
2. reference resolution for farm, crop and variety;
3. canonical 93-field construction;
4. PostgreSQL report creation;
5. canonical payload persistence;
6. `canonical_report_id` linkage back to the exact source row;
7. committed/commit-rejected row status and commit error;
8. committed batch counters;
9. source workbook re-export for audit.

A commit endpoint is available at:

`POST /api/reports/master-import/:id/commit`

The original staged source workbook can be reconstructed with:

`GET /api/reports/master-import/:id/source.xlsx`

## 7. Canonical export/import

Canonical export/import is available independently of the 38-column master exchange:

- `GET /api/reports/export-canonical.xlsx`
- `POST /api/reports/import-canonical.xlsx`

The canonical round-trip test writes all 93 fields to XLSX, reads them back, and asserts exact field/value preservation.

## 8. Database migration

Phase 23 adds:

`server/migrations/008_phase23_canonical_provenance.sql`

It creates:

- `scout_reports.canonical_payload`
- `report_import_rows.canonical_payload`
- `report_import_rows.committed_at`
- `report_import_rows.commit_error`
- `report_import_batches.committed_rows`
- `report_import_batches.committed_at`
- canonical-report import index

### Execution boundary

The supplied development ZIP does not contain `.env`, PostgreSQL credentials, `psql`, or a live database connection. Therefore **a live Phase 23 PostgreSQL migration cannot honestly be marked executed from this artifact-building environment**.

The target operator must run, from `finalbuild`:

```bash
npm run migrate
```

and then verify the migration against the Phase 23 database before production use.

## 9. Verification executed in this build environment

### PASS

- Actual source workbook: 38 columns
- Exact source heading comparison: PASS
- 38 source keys: unique and recognized
- 93-field dictionary: PASS
- Form farm choices: PASS
- Field/Greenhouse/Shadenet: PASS
- `isGreenhouse` reconciliation: PASS
- Canonical artifact presence: PASS
- 93-field XLSX round trip: PASS
- Canonical report builder emits exactly 93 fields: PASS
- Existing `saveReport()` CRUD regression test: PASS after correcting its stale mock for the current 33-field report header shape

### Environment-gated

The complete `RUN_DB_INTEGRATION=1 npm test` execution was **not claimed as completed in this artifact-building environment** because the ZIP intentionally excludes `node_modules` and the environment could not obtain the missing npm packages. A live PostgreSQL client/database is also unavailable here.

This is an evidence boundary, not a fabricated PASS.

## 10. Exit criteria

Phase 23 implementation is complete in the project tree.

Final release certification requires the operator environment to execute:

```bash
npm ci --registry=https://registry.npmjs.org/
npm run migrate
RUN_DB_INTEGRATION=1 npm test
npm run verify:phase23
```

The release is certified only when the final test result reports:

`fail 0`

and the migration completes successfully against the intended Phase 23 PostgreSQL database.
