# Phase 25 — Form / Spreadsheet Reference Repair — 2026-08-13

## Source reviewed
Latest uploaded workbook: `Copy of Combined Scout Report Master ver_24-2026.xlsx`; crop/variety relationships were taken from the `Names` worksheet.

## Repairs
- GH is now an active, empty text input on first render. Greenhouse mode requires a GH number before save.
- Crop selection now uses a generated spreadsheet catalogue rather than the stale four-item/demo reference JSON.
- Variety selection is nested under the selected spreadsheet crop and retains the source crop code needed by the existing PostgreSQL model. This also handles the spreadsheet's multiple source codes under `Unknown`.
- Added controlled Other Condition / Stress reference separately from disease/symptom reference.
- Kept all 38 master observation controls.
- Renamed the misleading `Save Draft` button to `Save Report` because it previously called the ordinary report-save operation rather than a dedicated draft endpoint.
- Tightened logout toolbar sizing.
- Added regression tests for the new form/reference behavior.

## Latest spreadsheet inventory
The latest workbook `Names` sheet yields **130 unique Species crop types** and **3,475 unique Species→Variety source pairs**. This supersedes the older 3,466 figure in prior Phase 24 notes; the new figure is based only on the latest uploaded workbook.

The 38-column `Clean Data` sheet contains 14 pest categories, 7 direct disease/symptom observation columns, and 6 additional condition/stress columns.

## Database
The project migration already contains the requested 13 farms and spreadsheet-aligned crop/variety seed data. Run `npm run migrate` against the intended PostgreSQL database before browser save testing; otherwise a database that still contains only the original three farms will continue to reject the remaining farm choices.

## Verification
Targeted Phase 25 form/reference tests: expected 5/5. Existing Phase 23/24 tests should remain run after `npm ci` on the operator machine.
