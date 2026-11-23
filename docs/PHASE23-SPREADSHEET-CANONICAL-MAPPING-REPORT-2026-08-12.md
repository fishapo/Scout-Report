# Spreadsheet ↔ Canonical Mapping Report — Phase 23

## Source

`Combined-Scout-Report-Master-ver_21-2026.xlsx` → `Clean Data`

Verified source width: **38 columns**.

## Mapping rule

The 38 source headings remain source-specific master fields. Header identity is preserved in `masterObservations` / `report_import_rows.source_payload`.

The following fields have direct canonical meaning:

| Source | Master key | Canonical destination |
|---|---|---|
| WEEK | week | implementationWeek / provenance of master row |
| Farm | farm | farmId + farmName |
| GH | gh | production-area metadata; Greenhouse → isGreenhouse=true |
| Inpl. wk-year | inplanting_week_year | preserved master/source value |
| Crop | crop | cropType |
| Variety | variety | variety |
| Remaining 32 observation columns | normalized observation keys | masterObservations + classified pest/disease/stress observations |

## Exact 38-column inventory

The authoritative machine-readable mapping is:

`docs/PHASE23-MASTER-COLUMN-MAPPING.csv`

The existing 38-column inventory remains:

`docs/phase22-master-import/master_column_inventory.csv`

## Canonical 93-field layer

The authoritative canonical field list is:

`docs/next-phases/data-model/field-dictionary.json`

Phase 23 does not replace the source-specific master fields with invented semantics. Instead it creates a canonical snapshot alongside the source payload. This preserves auditability while allowing future business-approved semantic mappings to be strengthened without losing the original spreadsheet values.

## Preservation guarantee

For every staged source row:

- original heading/value pairs → `report_import_rows.source_payload`
- normalized application values → `normalized_payload`
- canonical 93-field record → `canonical_payload`
- PostgreSQL report identity → `canonical_report_id`
- source row identity → `source_row_number`

The original source rows can be reconstructed into a `Clean Data` workbook through the import-batch source export endpoint.
