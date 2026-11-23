# Scout Report Phase 24 — Fix Verification

Date: 2026-08-13

## Fixes applied

1. Corrected the Phase 24 form-alignment test so `GREENHOUSE` is treated as a location mode, not a farm choice.
2. Confirmed the Scout Report farm choices are exactly:
   - FARM 1 through FARM 11
   - FARM 12A
   - FARM 12B
3. Removed legacy `GREENHOUSE` farm seed inserts from the two spreadsheet reference migrations.
4. Kept the required location modes:
   - Field
   - Greenhouse
   - Shadenet
5. Kept the GH field empty by default and editable only when Greenhouse mode is selected.
6. Corrected the HTML section nesting around the pest/disease reference controls.
7. Retained spreadsheet crop/variety dependency, pest/disease references, import, export and print controls.

## Verification completed in this build

### Master form alignment

`node --test server/master-form-alignment.test.js`

Result: **7 passed, 0 failed**

### Preview/browser tests

`node --test previews/*.test.js`

Result: **9 passed, 0 failed**

### Phase 20 dictionary verification

`node scripts/verify-phase20.js`

Result: **PASS**

- Dictionary version: 1.1.0
- Canonical fields: 93
- Required baseline fields: farmId, farmName, cropType, reportDate
- Source adapters: 5
- Source fixtures: 3/3 detected

## Full npm test

A full `npm test` was not executed in the build container because the uploaded project does not contain installed npm dependencies and network package installation was unavailable. Run the following on Windows after extracting the ZIP:

```bash
npm ci
npm test
```

Expected target after installation:

```text
fail 0
```
