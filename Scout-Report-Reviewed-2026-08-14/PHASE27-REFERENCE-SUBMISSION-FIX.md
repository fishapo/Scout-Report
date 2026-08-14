# Scout Report Phase 27 — Reference Selection & Submission Contract Fix

Date: 2026-08-13

## Verified current behavior

The live reference API responds successfully for farms, crop types, varieties, pests and diseases. The supplied Phase 26 ZIP contains the full spreadsheet crop catalog (130 crop types / 3,475 variety pairs) and the active greenhouse number field.

## Defects found in Phase 26

### 1. Crop submission mismatch

The form displays the spreadsheet master crop catalog, but its `payload()` function submitted the crop source code (for example `OST`) as `cropType`.

The report store validates `cropType` against `crop_types.id` or `crop_types.name`. A source code is neither the database crop ID nor the crop name in the authoritative spreadsheet-reference migration. This caused the browser submission error:

`Valid crop type is required`

### 2. Farm fallback mismatch

The Phase 26 form generated synthetic fallback IDs such as `farm-farm4` for farms missing from the database. The report store cannot resolve those synthetic IDs. The corrected form keeps missing farms active for selection, but submits an empty `farmId` and the canonical `farmName`, allowing the backend to use the real database reference when it exists. Production submission still requires the farm reference to exist in PostgreSQL; the UI does not fabricate database records.

## Fix implemented

- Crop dropdown still uses `/api/reference/master-crops`.
- Crop option stores the spreadsheet crop name in `data-name`.
- Report payload now sends `cropType` as the selected spreadsheet crop name.
- Farm options remain active for all approved FARM 1 through FARM 12B choices.
- A live database farm uses its real database ID.
- A farm missing from the database no longer receives a fake ID.
- GH input remains active and empty by default.
- Location modes remain Field / Greenhouse / Shadenet.

## Required database action

The current database still has only three farms. Run:

```bash
npm run migrate
```

Then verify:

```bash
psql -U scout_user -d scout_report -c "SELECT id, name, location FROM farms ORDER BY id;"
```

The authoritative Phase 22/23 spreadsheet-reference migration defines:

FARM 1, FARM 2, FARM 3, FARM 4, FARM 5, FARM 6, FARM 7, FARM 8, FARM 9, FARM 10, FARM 11, FARM 12A, FARM 12B.

The same migration family contains the spreadsheet-derived crop/variety reference data required for form submission and master import.

## Verification

Focused form tests:

```bash
node --test previews/master-reference.test.js server/master-form-alignment.test.js
```

Full suite:

```bash
npm test
```

After migration, verify:

```bash
curl http://localhost:3000/api/reference/farms
curl http://localhost:3000/api/reference/master-crops
curl http://localhost:3000/api/reference/pests
curl http://localhost:3000/api/reference/diseases
```

## Important authentication note

`GET /user-form.html` returning `Found. Redirecting to /login` with curl is expected when no authenticated browser session/cookie is supplied. It does not indicate that the form file is missing.
