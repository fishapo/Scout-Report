# Phase 22 — Master Spreadsheet Import Integration

Date: 2026-08-12

## Source reviewed
- Combined Scout Report Master ver_21-2026(1).xlsx
- Headings.pdf
- Latest supplied project baseline: Scout-Report-Phase22-HOD-Remediation-2026-08-12-ROOTFIX.zip

## Source inventory
The `Clean Data` worksheet contains **38 columns** and **31,889 data rows** (plus the header row). The source headings are preserved in `master_column_inventory.csv`; database-safe keys are recorded in `master-import-schema.json`.

## Implementation
- `POST /api/reports/master-import/stage` — admin/HOD authenticated staging and validation.
- `GET /api/reports/master-import/:id` — admin/HOD batch status.
- `previews/user-form.html` — Admin/HOD master workbook selector.
- `server/import/master-import.js` — source-to-key mapper and observation classification.
- `server/import/master-import.service.js` — XLSX parsing, SHA-256 provenance, validation and chunked staging.
- `server/migrations/006_phase22_master_import_staging.sql` — extends existing import provenance tables.

The import stages before production creation so unresolved farm/crop/variety references cannot silently corrupt production data.

## Verification
PASS: 38-column source contract.
PASS: master mapper unit tests.
PASS: HOD workflow verification.
PASS: authentication-fix verification.
PASS: Phase 22 source gate 10/10.
PASS: canonical/XLSX/Phase 22 tests.

Full `npm test` still requires `npm ci` on the target machine; external dependency installation was unavailable in this build environment.

## Approval gate
Production commit of the 31,889 source rows is intentionally not automatic. Reference reconciliation must be approved against live farm/crop/variety tables first.
