# Phase 23 Form Fix — 12 August 2026

## Issue found

The delivered Phase 23 form contained the crop and variety controls, but the browser implementation fetched varieties through a second endpoint after crop selection. That made the dependent **Crop → Variety** control unnecessarily dependent on a second request and could leave the variety selector empty when that request failed or returned an unexpected response shape.

## Fix applied

The form now uses the already-loaded `/api/reference/crop-types` response as the primary source for dependent varieties. The PostgreSQL-backed reference controller already returns crop types with their varieties grouped under each crop type.

### Behaviour

1. Load farms and crop types once after authentication.
2. Populate Crop from the returned crop-type reference list.
3. Disable Variety until a Crop is selected.
4. On Crop selection, read that crop's `varieties` array directly.
5. Show a loading state and a clear `No varieties registered for this crop` state.
6. Enable Variety only when valid varieties exist.
7. Preserve the selected variety in the existing report payload and 38-column master observation object.

## Spreadsheet alignment retained

The source workbook `Clean Data` remains the authoritative 38-column source contract:

- WEEK
- Farm
- GH
- Inpl. wk-year
- Crop
- Variety
- 19 pest observation columns
- 7 disease/symptom columns
- 6 additional stress/other columns

The form retains all 38 source controls, the 14 required farm choices, Field/Greenhouse/Shadenet modes, environmental fields and GPS/location capture.

## Reference data

The Phase 23 reference migration seeds:

- FARM 1–FARM 11
- FARM 12A
- FARM 12B
- GREENHOUSE
- spreadsheet crop types and varieties
- spreadsheet pest categories
- spreadsheet disease/symptom categories

## Verification performed

Static Phase 23 verification:

- 38/38 source headings: PASS
- unique application keys: PASS
- 93/93 canonical dictionary: PASS
- 14/14 farm choices: PASS
- 3/3 location modes: PASS
- canonical/provenance artifacts: PASS
- dependent crop/variety implementation test: PASS
- spreadsheet pest labels: PASS
- spreadsheet disease labels: PASS
- JavaScript extracted from `previews/user-form.html`: syntax PASS
- Phase 23 targeted regression suite: PASS

### Targeted regression result

**24 tests passed, 0 failed, 0 skipped** across the Phase 23 alignment/import/canonical tests after the form fix.

## Environment-gated verification

The full `npm test` command cannot be honestly reported as executed in the artifact-building environment because the ZIP does not include `node_modules`, and dependency installation was unavailable in that environment. The operator must run the full install, migration and DB integration suite before release certification.

Recommended operator commands:

```bash
npm ci --registry=https://registry.npmjs.org/
npm run migrate
RUN_DB_INTEGRATION=1 npm test
npm run verify:phase23
```

Release certification requires zero test failures and successful database migration.
