# Scout Report — Next Project Phases & Data Rebase Master Plan

**Baseline reviewed:** Scout-Report-Admin-Dashboard-Rebase-2026-08-10.zip
**Plan date:** 11 August 2026
**Baseline status:** Development/rebase candidate

## 1. Baseline determination

The supplied project already contains the core four-role verification chain, shared dashboard, administrator management, report Excel exchange, PostgreSQL persistence, workflow state/history and automated tests. The next phase should therefore **extend the data model and field-capture capability rather than redesign the workflow**.

The retained roles are:
- `scout`
- `inter_farm_supervisor`
- `head_of_department`
- `admin`

The mandatory chain remains:
`Scout -> Inter-Farm Supervisor -> Head of Department -> Administrator -> Approved`.

## 2. Main gaps found for the next release

1. The current scout form captures only a narrow core: farm, greenhouse flag, crop, variety, week/year, weather, temperature, humidity, GPS, pest observations, disease observations and notes.
2. The current Excel exchange is a flat report header with aggregate pest/disease counts; it does not yet represent detailed survey stops, weeds, crop stand, soil, irrigation, nutrients, treatments, recommendations, media, samples or structured weather.
3. The data model needs a visit/stop layer so one field visit can contain repeated sampling locations and multiple observation types.
4. Import needs a normalization layer so different legacy/current scout-report layouts can map into the canonical platform schema without bypassing validation or workflow.
5. The form should become configuration-driven by crop, growth stage and organisation, with optional modules rather than one fixed form.
6. The platform needs import provenance, row-level validation, mapping versions, duplicate detection and reconciliation reporting.
7. Verification needs structured checklists so each gate can confirm data completeness, evidence and corrective comments.
8. Operational release evidence remains separate from application functionality: CI, staging, backup/restore, rollback and production approval must still be executed in the operator environment.

## 3. Canonical data domains to support

### A. Visit and identity
- report/visit ID
- organisation/program
- farm, field/block/plot
- grower/producer
- scout and verifier identities
- visit date/time and duration
- season, campaign, implementation week/year
- visit purpose and scouting pattern

### B. Location and mapping
- latitude/longitude
- GPS accuracy
- altitude
- county/sub-county/ward/location/village
- field area and unit
- greenhouse/open-field designation
- field/block/plot identifiers
- optional polygon/GeoJSON boundary

### C. Crop and phenology
- crop type
- variety/cultivar
- crop stage / BBCH or local stage
- planting date
- expected harvest date
- crop age
- plant height
- row spacing / plant spacing
- plant population / stand count
- germination/establishment
- root development
- yield estimate where applicable

### D. Weather and microclimate
- weather condition
- air temperature
- humidity
- wind speed/direction
- cloud cover
- rainfall / recent rainfall
- leaf wetness where available
- observation time
- optional external weather source/provenance

### E. Soil and water
- soil moisture
- soil texture
- pH
- EC/salinity
- soil temperature
- drainage
- irrigation method
- irrigation status/frequency
- water stress
- water quality notes

### F. Crop health
- overall plant health
- vigour
- chlorosis/yellowing
- wilting
- nutrient deficiency indicators
- abiotic stress
- mechanical damage
- frost/heat/hail/flood/drought damage
- root/stem/leaf/flower/fruit observations

### G. Weeds
- weed species
- pressure rating
- average/max height
- density/count
- growth stage
- location within field/planting row
- affected area percent
- notes/photos

### H. Insects, pests and beneficial organisms
- pest species
- common/scientific name
- life stage
- count/population
- trap count/type
- damage percent
- severity
- affected plant part
- sampling method
- sampling unit
- economic threshold/reference threshold
- beneficial insect/organism observations

### I. Diseases and symptoms
- disease/pathogen
- common/scientific name
- symptom
- severity
- infection/incidence percent
- affected plant part/location
- lesion/spot count
- lesion colour/shape where relevant
- disease stage/progression
- diagnostic confidence
- sample/lab reference

### J. Management and recommendations
- action required
- recommendation
- priority
- responsible person
- due date
- treatment/product name
- active ingredient
- rate/dose
- unit
- application method
- target pest/disease/weed
- application date
- re-entry/pre-harvest interval fields if the organisation requires them
- follow-up result

### K. Evidence
- photo/video/audio
- attachment type
- caption
- timestamp
- GPS provenance
- evidence category
- hash/file integrity metadata

### L. Samples and diagnostics
- sample ID
- sample type
- collection date/time
- collector
- lab destination
- test requested
- result
- result date
- diagnosis confidence
- certificate/reference number

### M. Verification and governance
- workflow stage
- current holder
- verification checklist
- decision
- comments
- correction request
- actor
- timestamp
- source/import batch
- immutable event history

## 4. Next milestone sequence

### Phase 20 — Requirements & source-format inventory
Freeze the canonical field dictionary and register all legacy/current report structures.

### Phase 21 — Canonical data model
Add visit, survey-stop, structured observations, media, samples, recommendations and import provenance tables.

### Phase 22 — Dynamic scout form
Build section-based, crop/stage-aware form configuration with conditional fields and repeatable observation blocks.

### Phase 23 — Import normalization engine
Support multiple source layouts, header aliases, column mapping, row validation, duplicate detection, dry-run and reconciliation output.

### Phase 24 — Expanded field observations
Implement weeds, crop stand, soil, irrigation, nutrient/abiotic stress, weather detail and sampling methods.

### Phase 25 — Evidence and diagnostics
Add media attachments, sample records, diagnostic results and evidence links.

### Phase 26 — Verification checklists
Make each role's verification gate explicit and auditable, with mandatory checklist items before approval/forwarding.

### Phase 27 — Analytics 2.0
Add field-level trends, pest/disease incidence, severity, action status, verification turnaround, geography and import quality metrics.

### Phase 28 — Offline/mobile resilience
Add draft autosave, offline queue, sync conflict handling and resilient media upload.

### Phase 29 — Operational release gates
Run clean install, full tests, CI, staging, backup/restore, rollback, security review and production approval.

## 5. Definition of done for the data rebase

- No existing workflow role is removed.
- Existing reports remain readable.
- Existing `/api/reports` and `/api/workflow` contracts remain backward compatible unless versioned.
- Every imported record has source/provenance metadata.
- Imported records always enter the workflow as drafts unless explicitly approved through the normal chain.
- All required fields are validated server-side.
- Every verification action is auditable.
- The canonical schema can represent all fields listed in the data dictionary.
- At least four source-layout adapters pass fixture tests.
- Export can round-trip canonical records without silent data loss.
- The release gate has external evidence rather than inferred PASS status.

## 6. External structure review

The data dictionary is informed by current field-scouting structures that commonly capture grower/farm/scout identity, crop details, crop stage/height, plant population, weeds, insects, disease, weather and notable field conditions. UW–Madison's 2025/2026 field scouting template is particularly useful for repeated survey-stop sampling. Other current digital templates add soil moisture, plant health, wind/cloud cover, plant population and photos. Kenya sources emphasize regular scouting, pest populations, disease/weed monitoring and surveillance/reporting.

Sources reviewed:
- UW–Madison Field Scouting Report Template
- Jotform Crop Scouting Report / Crop Field Scouting Survey
- Agri-Data Field Scouting/Product Recommendation
- KALRO tomato scouting/IPM guidance
- KALRO green gram scouting guidance
- Kenya PP&FSD plant protection surveillance functions

## 7. Implementation rule

Do not replace the existing application wholesale. Rebase incrementally, one milestone at a time, with a passing test baseline after every migration and route change.
