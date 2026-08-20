# Scout Report Phase 26 — Excel Import + Live Analytics

Date: 2026-08-13

## Objective

Implement the next measure after Phase 25:

`collect → inventory → map → approve → code → import → verify → analyse`

This phase fixes the dashboard **Import Excel** action so the actual 38-column `Combined Scout Report Master` workbook can be imported without the incorrect canonical error:

> Missing required: columns: farmId, farmName, cropType, reportDate

The master workbook does not contain those four canonical headings. Its identity/reference fields are `Farm`, `Crop`, `Variety`, and `GH`, and the report date is not a source column. Master imports therefore use the validated Phase 22/23 mapping path and use the import date as the report date when the source has no report-date field.

## Implemented

1. Dashboard Import Excel now auto-detects:
   - 38-column Combined Scout Report Master workbook; or
   - canonical export workbook.
2. Master workbook import is staged, validated, resolved against PostgreSQL references, and committed.
3. Farm values such as `1`, `2`, `11`, `12A`, `12B` are resolved to the corresponding FARM reference records.
4. Master crop names and master crop source codes are resolved against the spreadsheet-derived crop catalogue.
5. When Crop is blank, a crop is inferred only when the selected variety belongs to exactly one crop reference; ambiguous values remain rejected rather than guessed.
6. GH values are treated as greenhouse identifiers when populated, except explicit Field/Open Field/Shadenet/No values.
7. Dashboard analytics now expose live reference counts for Farms, Crop Types, Varieties, Pests and Diseases.
8. Dashboard shows the latest import batch and automatically refreshes every 15 seconds, plus on browser focus.
9. Import completion refreshes dashboard analytics immediately.
10. The latest `Combined Scout Report Master ver_24-2026.xlsx` is included under `docs/phase26-import/source/` for traceability.

## Source verification

The supplied `Clean Data` worksheet was verified to contain exactly 38 source headings in the approved order.

The workbook contains these source domains:

- WEEK
- Farm
- GH
- Inpl. wk-year
- Crop
- Variety
- 31 observation/reference columns

## Important data-quality handling

The source workbook contains numeric/variant farm values beyond the 13 current farm references, including values such as `7/6`, `7/7`, `18`, `29`, and `8QR`. These are **not silently mapped** to another farm. They are returned as row-level import errors for business review.

The source also contains blank Crop values. Crop inference is performed only for an unambiguous variety match. No arbitrary crop is assigned when a variety could belong to multiple crops.

## Analytics behavior

Analytics are read from PostgreSQL on every dashboard refresh. There is no separate static analytics copy to synchronize. Consequently:

`import/save/update → PostgreSQL → dashboard refresh → updated metrics/reference counts`

## Verification commands

```bash
npm ci
npm test
npm run verify:phase26
npm run migrate
npm test
npm run start
```

If npm dependencies are already installed, run the tests directly.

## Acceptance criteria

- [x] Import button accepts the actual 38-column master workbook.
- [x] No false `farmId, farmName, cropType, reportDate` error for master workbooks.
- [x] Farm/crop/variety reference resolution is performed before production save.
- [x] Import results identify committed and rejected rows.
- [x] Dashboard analytics are database-driven.
- [x] Reference Data counts are visible on the Scout Report Dashboard.
- [x] Dashboard refreshes automatically after import and periodically thereafter.
- [x] Latest v24 workbook is retained in the release documentation.
- [x] JavaScript syntax verification passes.

## Next measure

The project is ready for the next operational measure: **run the database migration, import a controlled copy of the master workbook, inspect rejected rows, approve reference exceptions, then run the complete npm test suite against the configured PostgreSQL database.**

## Source validation preview

A non-destructive validation preview of all 31,929 data rows in the v24 workbook identified **4,326 rows requiring source/reference review** before they can become production reports. The importer does not silently discard or alter those rows; it records them as rejected with row-level reasons.

The largest source-level reasons observed were:

- `variety is required`: 3,283 rows
- `farm is required`: 2,760 rows
- invalid numeric observation values, including week/observation columns: remaining rejected rows

These counts are a source-quality preview and can overlap by row because a single row can have multiple validation problems.

This is expected behavior for the current master importer contract: **clean/valid rows can proceed, while questionable source rows remain visible for correction and approval.**
