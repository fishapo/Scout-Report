# Phase 24 Fix Log

## User-requested defects addressed

| Request | Resolution |
|---|---|
| Remove GREENHOUSE from farm list | `FARM_CHOICES` reduced to the 13 approved farms; GREENHOUSE remains a location mode. |
| Select Crop & Variety not implemented | Crop change now calls the dependent `/api/reference/crop-types/:id/varieties` endpoint and enables Variety after successful loading. |
| GH field should be empty | GH starts blank and is cleared for Field/Shadenet. |
| Enter greenhouse number | GH becomes editable in Greenhouse mode and is required for save. |
| Keep Field/Greenhouse/Shadenet | All three buttons retained. |
| Check pest/disease spreadsheet references | 14 pest and 12 disease/symptom references are loaded from the existing reference APIs derived from the workbook. |
| Logout button stretched | Header action flex behavior was overridden so logout is compact. |
| Import | Existing admin/HOD master workbook staging is retained and exposed in the toolbar. |
| Export | Added current-record CSV and JSON exports. CSV follows the 38-column master contract. |
| Print | Added print action and print CSS. |

## Regression protection

`verify-phase23.js` and `verify-master-form.js` now assert the 13-farm contract, GH behavior, dependent variety reference, pest/disease references and utility controls.
