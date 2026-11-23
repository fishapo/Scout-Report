# Baseline Gap Analysis — 11 Aug 2026

## Current platform strengths
- Four-role verification chain exists.
- Shared dashboard exists for all authenticated roles.
- Admin user/role management exists.
- Reference CRUD exists.
- PostgreSQL persistence exists.
- Workflow state and workflow events exist.
- XLSX import/export exists.
- Automated test suite and phase verification scripts exist.

## Current form fields observed
The current form visibly captures farm, greenhouse/open-field, crop type, variety, implementation week/year, weather, temperature, humidity, GPS location, pest observations, disease observations and general notes.

## Missing or insufficiently structured field data
| Domain | Gap | Priority |
|---|---|---|
| Visit | visit time, duration, purpose, route/pattern | High |
| Field | block/plot, area/unit, field code | High |
| Crop | growth stage, planting date, age, height, spacing | High |
| Stand | plants/area, good plants, gaps, establishment | High |
| Weather | wind, cloud, rainfall, leaf wetness | Medium |
| Soil | moisture, pH, EC, texture, drainage | High |
| Water | irrigation method/status/frequency | Medium |
| Weeds | species, pressure, height, density, area | High |
| Pest | life stage, sampling method, trap data, threshold | High |
| Disease | incidence vs severity, symptom, plant part, diagnosis confidence | High |
| Beneficials | predator/pollinator observations | Medium |
| Nutrients | deficiency symptoms and diagnosis | Medium |
| Abiotic | drought, heat, frost, flood, mechanical damage | Medium |
| Management | treatment/action/recommendation/follow-up | High |
| Evidence | photos, captions, timestamps, hashes | High |
| Samples | sample chain and lab result | Medium |
| Import | source format, mapping, row errors, duplicate handling | Critical |
| Verification | checklist evidence and required fields by gate | Critical |
| Analytics | incidence, severity, action and turnaround metrics | High |
| Offline | draft queue and sync conflicts | Medium |

## Architectural recommendation
Use a stable `scout_reports` record as the business header, then add child entities rather than adding dozens of nullable columns. A report should represent a visit; repeated observations should be stored as typed child records.
