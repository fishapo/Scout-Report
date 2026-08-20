# Scout Report — Master Spreadsheet Form Integration

**Date:** 12 August 2026  
**Source:** `Combined Scout Report Master ver_21-2026.xlsx`

## Objective
Rebase the Scout Report entry form around the supplied master spreadsheet while preserving authentication, reference APIs, geolocation, repeatable observations, workflow controls and the existing master-workbook import path.

**Sequence:** collect → inventory → map → approve → code → verify.

## Source inventory
- `Clean Data`: 38 source columns.
- `Names`: crop/series/variety reference material and operational issue terms.
- 130 workbook-derived crop types.
- 3,466 workbook-derived crop-variety pairs with recognized parent series.
- 14 distinct pest observation domains from the `Clean Data` headings.
- 12 disease/condition domains used for the disease reference list.

## Form changes
### Farm Information
The form/database now support exactly the requested choices: `FARM 1` through `FARM 11`, plus `FARM 12A` and `FARM 12B`.

### Production Area
The old Field/Greenhouse selector is now:
- Field
- Greenhouse
- Shadenet

Greenhouse keeps the legacy `isGreenhouse` compatibility flag. The selected `siteType` is retained with the report location metadata so Shadenet is not collapsed into Greenhouse.

### Crop Information
Crop types and varieties remain dependent selections and are loaded from the application's reference APIs. The database reference migration is derived from the workbook's `Names` sheet rather than a generic crop list.

### Environmental Conditions / Location
Weather, temperature and humidity remain available. Browser geolocation remains available through the Location button. The selected production area is included with the location payload.

### Pests / Diseases
Existing repeatable pest and disease observation cards are retained. Their dropdowns now use the workbook-derived reference labels through the existing reference APIs.

Blank source observations remain blank during import; they are not silently changed to zero because the source alone does not establish the business meaning of blank.

## Database implementation
Added `server/migrations/007_master_spreadsheet_reference_data.sql`.

It seeds/updates:
- 13 farm choices;
- 130 crop types;
- 3,466 crop-variety pairs;
- 14 pest references;
- 12 disease/condition references.

The migration respects the existing `crop_varieties` PostgreSQL serial ID and inserts only parent/name pairs.

## Reproducibility artifacts
`docs/phase22-master-import/` now contains the workbook-derived manifest, crop reference CSV, observation reference CSV, source workbook copy, and the existing 38-column import contract/inventory.

## Preserved functionality
Authentication, role-based routing, the Scout/HOD/admin workflow, reference APIs, dynamic varieties, repeatable observations, environmental data, geolocation, master workbook staging and dashboard functions remain in place. The planned verification chain remains Scout → Inter-Farm Supervisor → Head of Department → Administrator → Approved.

## Approval boundary
The workbook-derived mapping implements the supplied structure but does not invent business meanings for ambiguous fields. The existing master import contract retains proposed/pending approval where source semantics are unclear.

## Next measure
1. `npm ci`
2. `npm run verify:master-form`
3. `npm run verify:master-import`
4. `npm run verify:phase22`
5. `npm test`
6. `npm run migrate`
7. Browser smoke test `/scout-form` for all farm choices and all three production-area buttons.
8. Confirm crop → variety dependency and pest/disease references.
9. Stage a master workbook and confirm it remains subject to workflow verification.
