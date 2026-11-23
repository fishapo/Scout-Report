# Phase 26 Farm Dropdown Hotfix — 2026-08-13

## Problem
The Scout Report form intentionally disabled farm options that were absent from the current `/api/reference/farms` response. Because the PostgreSQL database still contained only a partial farm reference set, FARM 3 through FARM 12B appeared greyed out.

## Fix
All 13 spreadsheet farm choices are now rendered as active selectable options. The form uses the live database ID when a farm is returned by the reference API and falls back to the canonical spreadsheet farm ID when the database reference is temporarily incomplete.

GREENHOUSE is not a farm choice; it remains a location mode. The GH number field remains an active input.

## Required database step
The UI fix does not fabricate database records. Run the migrations so the canonical farm references exist in PostgreSQL:

```bash
npm run migrate
```

Then verify:

```bash
psql -U scout_user -d scout_report -c "SELECT id, name, location FROM farms ORDER BY name;"
```

Expected spreadsheet farm names:
FARM 1, FARM 2, FARM 3, FARM 4, FARM 5, FARM 6, FARM 7, FARM 8, FARM 9, FARM 10, FARM 11, FARM 12A, FARM 12B.

## Verification
The focused master-form suite passes 8/8. The regression specifically verifies that the form no longer contains the disabling branch for missing farm references.
