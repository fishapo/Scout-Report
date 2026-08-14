# Scout Report — Phase 27 Migration Fix

## Problem found
The release contained two different `007` reference-data migrations:
- `007_master_reference_data.sql`
- `007_master_spreadsheet_reference_data.sql`

The first migration attempted to insert legacy farm names such as `FARM 1` using different IDs (`farm-1`, etc.). Because `farms.name` is unique, `npm run migrate` failed with a duplicate-key error when the database already contained `FARM 1`.

## Fix applied
The release now has one authoritative migration:

`server/migrations/007_master_reference_data.sql`

The duplicate spreadsheet migration filename was removed.

The migration is now designed to be repeatable:
- farm reference inserts use `ON CONFLICT DO NOTHING`;
- crop-type inserts use `ON CONFLICT DO NOTHING` and do not rename existing legacy crop IDs;
- spreadsheet varieties resolve their parent crop by the authoritative crop name instead of assuming that `CROP-001` etc. are still the legacy database IDs;
- pest and disease reference inserts use `ON CONFLICT DO NOTHING`;
- `master_observations` is created with `IF NOT EXISTS`.

This prevents the migration from corrupting the existing Tomato/Pepper/Cucumber/Lettuce IDs while still allowing the complete spreadsheet crop catalogue to be inserted.

## Dependency verification
`package.json` explicitly declares:
- `dotenv ^16.4.7`
- `pg ^8.11.3`
- `express ^4.22.2`

`package-lock.json` contains `node_modules/dotenv` version `16.4.7`.

If Windows reports `EBUSY` while running `npm ci`, that is a locked local `node_modules` directory rather than a missing dependency in the project.

## UI verification
The existing Phase 27 form verification passes for:
- 130 spreadsheet crop types;
- spreadsheet-tied varieties;
- active greenhouse-number input;
- Field / Greenhouse / Shadenet location modes;
- separate pest, disease and other-condition references;
- all 38 master source columns;
- 93-field canonical dictionary;
- spreadsheet crop submission;
- GPS/environment controls.

## Verification performed in this package
The following command completed successfully:

`node --test previews/master-reference.test.js server/master-form-alignment.test.js`

Result: **13 tests passed, 0 failed**.

## Recommended Windows verification
From the project directory:

```bash
# If npm ci reports EBUSY, close running Node/npm processes first.
# Then remove only the local dependency directory and reinstall.
rm -rf node_modules
npm ci
npm run migrate
npm test
```

Then verify the reference data:

```bash
psql -U scout_user -d scout_report -c "SELECT COUNT(*) AS farms FROM farms;"
psql -U scout_user -d scout_report -c "SELECT COUNT(*) AS crop_types FROM crop_types;"
psql -U scout_user -d scout_report -c "SELECT COUNT(*) AS varieties FROM crop_varieties;"
psql -U scout_user -d scout_report -c "SELECT COUNT(*) AS pests FROM pests;"
psql -U scout_user -d scout_report -c "SELECT COUNT(*) AS diseases FROM diseases;"
```

API smoke checks:

```bash
curl http://localhost:3000/api/reference/farms
curl http://localhost:3000/api/reference/master-crops
curl http://localhost:3000/api/reference/pests
curl http://localhost:3000/api/reference/diseases
```
