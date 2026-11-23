# Phase 26 Hotfix — Crop Type Submission

## Reported symptom
The Scout Report form displayed `Valid crop type is required` when submitting a valid crop/variety selection.

## Root cause
The form was deriving `cropType` from the selected **variety option**:

```text
varietyOption.dataset.cropCode
```

The selected crop itself owns the spreadsheet source code. The implementation could therefore submit an empty or incorrect crop type even though a crop was selected.

## Fix
The form now stores the first spreadsheet source code on the crop option and builds the submission payload from the selected crop option:

```text
crop-select option -> dataset.code -> payload.cropType
```

The master observation export uses the same crop source.

## Validation
- Crop must be selected.
- Variety must be selected for that crop.
- Farm must be selected.
- Report Date must be supplied.
- Greenhouse mode requires the GH number.

## Verification
Targeted UI/reference tests: **12 passed, 0 failed**.
Phase 26 workbook verification remains: **38 headings, 130 crop types, 3,475 varieties**.

## Operator action
Replace the running project with this hotfix release, restart the Node server, hard-refresh the browser, select a crop, select its variety, and submit again.
