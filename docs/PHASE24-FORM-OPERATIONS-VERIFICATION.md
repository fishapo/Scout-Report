# Phase 24 — Scout Report Form Operations & Reference Alignment

## Basis

This phase continues directly from the Phase 23 spreadsheet/form alignment build. The approved source workbook remains:

`docs/phase22-master-import/source/Combined-Scout-Report-Master-ver_21-2026.xlsx`

The `Clean Data` worksheet was inspected directly. It contains 38 columns. The source inventory contains 130 crop types, 3,466 varieties, 14 pest categories and 12 disease/symptom categories.

## Changes completed

### 1. Farm selection

The Scout Report form now exposes exactly the 13 requested farm choices:

- FARM 1 through FARM 11
- FARM 12A
- FARM 12B

`GREENHOUSE` is no longer a farm choice. Greenhouse remains a **location mode**, not a farm.

### 2. Location mode and GH

The preserved location buttons are:

- Field
- Greenhouse
- Shadenet

The `GH` control now starts empty. It becomes editable only when **Greenhouse** mode is selected, allowing the operator to enter the greenhouse number/identifier. Switching back to Field or Shadenet clears the GH value.

The legacy `isGreenhouse` compatibility flag continues to be derived only from Greenhouse mode.

### 3. Crop → Variety

Crop types continue to come from the spreadsheet-derived PostgreSQL reference data. Selecting a crop now explicitly calls:

`GET /api/reference/crop-types/:id/varieties`

The Variety selector remains disabled until a crop is selected, then loads only varieties belonging to that crop. A local nested-reference fallback remains available if the dependent API request fails.

### 4. Pest and disease references

The form now loads the controlled pest and disease/symptom reference lists from:

- `GET /api/reference/pests`
- `GET /api/reference/diseases`

The existing 38-column master observation controls remain intact so spreadsheet values can still be captured without changing the source contract.

### 5. Import / export / print

The form now provides operational controls for:

- **Import** — admin/HOD master workbook staging and validation
- **Export CSV** — exports one current 38-column master row using the approved source headings
- **Export JSON** — exports the current report payload together with the 38-column master row
- **Print** — print-optimized form output
- **Log Out** — retains authenticated logout behavior and is no longer stretched across the header

### 6. Save validation

A Greenhouse report cannot be saved without a greenhouse number in `GH`.

Farm, Crop, Variety and Report Date remain required.

## Verification performed

Static and source-contract checks completed successfully:

- Source workbook: 38/38 columns
- Source headings vs approved schema: exact match
- Source database keys: 38 unique keys
- Canonical dictionary: 93 fields
- Farm choices: 13/13
- Greenhouse excluded from farm choices: PASS
- Location modes: 3/3
- GH starts empty: PASS
- Crop → Variety reference endpoint: PASS
- Pest reference endpoint/control: PASS
- Disease reference endpoint/control: PASS
- Import/export/print controls: PASS
- Phase 23 canonical/provenance artifacts: present
- Spreadsheet reference inventory: 130 crops / 3,466 varieties / 14 pests / 12 diseases

## Operational test limitation

The Windows development environment previously reported `EBUSY` while npm attempted to remove locked `node_modules` folders, followed by `MODULE_NOT_FOUND: dotenv`. Those errors are dependency-install/environment errors rather than form-contract failures. The delivered project should be tested with a clean dependency install on an unlocked local path before claiming a full integration-test pass.

## Next workflow gate

The requested workflow is now represented as:

**collect → inventory → map → approve → code → verify → release**

The next measure is a clean Windows dependency installation followed by database migration, integration tests, browser/form smoke testing, and a final release checksum.
