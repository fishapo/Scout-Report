# Phase 21 Data Model Approval Record

Date: 2026-08-11

## Inputs

- Phase 20 approved canonical dictionary: 93 fields.
- Phase 20 source adapters: current flat, repeated survey stops, digital scouting, Kenya IPM/surveillance, legacy wide spreadsheet.
- Existing Scout Report PostgreSQL schema.
- Existing four-stage verification workflow.

## Decisions

- Preserve legacy report columns for compatibility.
- Add canonical report-header fields only where the field is report-level.
- Use child tables for repeating observations.
- Keep survey-stop identity separate so multiple sampling methods/locations can be represented.
- Preserve import source payload and normalized payload as JSONB for reconciliation/audit.
- Preserve file SHA-256 for provenance.
- Keep workflow approval independent of import validation.

## Approved tables

`report_survey_stops`, `crop_observations`, `soil_observations`, `irrigation_observations`, `weather_observations`, `weed_observations`, `nutrient_observations`, `stress_observations`, `management_actions`, `recommendations`, `report_media`, `diagnostic_samples`, `report_import_batches`, `report_import_rows`.

Existing pest/disease tables are extended rather than replaced.

## Acceptance criteria

- [x] 93-field Phase 20 dictionary remains the source contract.
- [x] Migration is transactional.
- [x] Existing report identity and workflow references remain intact.
- [x] Repeatable observation domains have dedicated child tables.
- [x] Referential integrity uses foreign keys.
- [x] Range checks cover key measurements and percentages.
- [x] Import provenance is persisted.
- [x] Query indexes are provided for report and observation access.
- [x] Static Phase 21 verifier passes.
- [ ] Live PostgreSQL migration execution — requires configured DB runtime.
- [ ] Full application test suite — requires dependencies installed and DB/runtime where applicable.

## Approval

Phase 21 is **code-complete for the canonical schema implementation**, with live database execution retained as the next environment-dependent verification gate.
