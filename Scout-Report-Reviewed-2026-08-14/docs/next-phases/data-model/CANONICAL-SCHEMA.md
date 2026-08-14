# Phase 21 — Canonical PostgreSQL Data Model

## Status

**APPROVED FOR IMPLEMENTATION / STATIC VERIFIED — 2026-08-11**

Phase 20 supplied the approved 93-field canonical dictionary. Phase 21 turns that contract into a backward-compatible PostgreSQL model.

## Collect → Inventory → Map → Approve → Code

1. **Collect** — use the Phase 20 source inventory and canonical field dictionary.
2. **Inventory** — group fields into identity, location, crop, visit, weather, soil, water, weed, pest, disease, stress, action, recommendation, evidence, diagnostics and provenance.
3. **Map** — map each canonical field to a report-header column or a repeatable child table.
4. **Approve** — Phase 20 status is `phase20-approved-for-phase21`; no canonical field is silently removed.
5. **Code** — execute `server/migrations/004_expanded_scouting_model.sql` after migrations 001–003.

## Modeling rule

Do not put every observation into `scout_reports`. The report header remains the stable identity and summary record. Repeating observations belong in child tables linked to `scout_reports.id` and, where appropriate, `report_survey_stops.id`.

## Canonical model

| Domain | Persistence | Purpose |
|---|---|---|
| Identity | `scout_reports` | Farm, grower, scout and report identity |
| Location | `scout_reports`, `report_survey_stops` | Field/GPS and repeated sampling locations |
| Crop | `scout_reports`, `crop_observations` | Crop stage, population, height, spacing and vigour |
| Visit | `scout_reports` | Date, purpose, pattern and duration |
| Weather | `scout_reports`, `weather_observations` | Summary and repeated weather measurements |
| Soil | `soil_observations` | Moisture, pH, EC, texture, drainage and soil temperature |
| Water | `irrigation_observations` | Method, status, frequency, duration, source and stress |
| Weed | `weed_observations` | Species, pressure, density, height and affected area |
| Pest | `pest_observations` | Existing pest data plus scientific name, life stage, sampling, threshold and beneficials |
| Disease | `disease_observations` | Existing disease data plus incidence, symptoms, plant part and diagnostic confidence |
| Nutrient | `nutrient_observations` | Deficiency observations |
| Abiotic/mechanical | `stress_observations` | Non-pest/non-disease stress |
| Management | `management_actions` | Treatments, actions and outcomes |
| Recommendations | `recommendations` | Prioritized recommendations and follow-up |
| Evidence | `report_media` | Photos/files with hashes and capture location |
| Diagnostics | `diagnostic_samples` | Sample chain and laboratory/diagnostic results |
| Provenance | `report_import_batches`, `report_import_rows` | Source file, mapping, row validation and reconciliation |
| Verification | existing `report_workflows`, `report_workflow_events` | Scout → Supervisor → HOD → Admin approval chain |

## Backward compatibility

Legacy `scout_reports`, `pest_observations` and `disease_observations` columns remain. Phase 21 adds canonical columns and child tables rather than replacing existing contracts.

Imported records do not receive approval from a source spreadsheet. Import status is provenance/reconciliation state; report approval remains the application's workflow.

## Execution

```bash
npm run migrate
npm run verify:phase21
npm test
```

A real PostgreSQL migration run requires the configured PostgreSQL service and `.env` credentials. Static verification is included and must pass before the database migration is attempted.
