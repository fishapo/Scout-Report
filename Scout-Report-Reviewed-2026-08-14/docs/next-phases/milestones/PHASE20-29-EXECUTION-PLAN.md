# Step-by-Step Milestone Execution Plan

## Phase 20 — Source Inventory & Canonical Dictionary
**Goal:** freeze the data contract before schema changes.

### Steps
1. Collect all current Scout Report Excel/Word/PDF structures used by the organisation.
2. Export the current platform XLSX template.
3. Register each source as an adapter in `docs/next-phases/import-mapping/source-adapters.json`.
4. Map every source field to a canonical field or explicitly mark it unmapped.
5. Resolve units, allowed values, required/optional status and reference-data rules.
6. Obtain business-owner sign-off on the dictionary.

### Acceptance
- 100% of source columns mapped or consciously rejected.
- No duplicate canonical names.
- Required fields documented.

### Termux commands
```bash
npm test
node scripts/verify-dependencies.js
git status
git add docs/next-phases
git commit -m "docs: freeze scout report canonical data dictionary"
```

## Phase 21 — Expanded PostgreSQL Model
**Goal:** support repeated survey stops and rich observations.

### Steps
1. Add migration `004_expanded_scouting_model.sql` after Phase 20 approval.
2. Add stores/services one child domain at a time.
3. Add transaction tests.
4. Backfill only where source data is unambiguous.
5. Keep legacy columns for compatibility.
6. Run full test suite and migration verification.

### Acceptance
- Migration applies cleanly.
- Existing reports still load.
- Child records are transactional.

## Phase 22 — Dynamic Scout Form
**Goal:** make the form comprehensive without overwhelming scouts.

### Steps
1. Load section configuration from `server/form-config/scout-report.sections.json`.
2. Render visit/crop/environment sections.
3. Add repeatable survey stops.
4. Add weeds, crop stand, soil and irrigation modules.
5. Add expanded pest/disease fields.
6. Add actions/recommendations/evidence modules.
7. Add client-side draft save, but keep server validation authoritative.

## Phase 23 — Import Normalization
**Goal:** import multiple layouts safely.

### Steps
1. Normalize headers.
2. Select adapter by explicit user choice or detected signature.
3. Map aliases into canonical fields.
4. Validate references and units.
5. Detect duplicates.
6. Produce dry-run report.
7. Commit accepted rows as drafts.
8. Store source file hash and row provenance.

## Phase 24 — Expanded Observations
Implement each domain independently: weeds -> crop stand -> soil/water -> weather -> beneficials -> nutrient/abiotic -> management actions.

## Phase 25 — Evidence & Diagnostics
Add secure media metadata, sample chain, diagnostic result and follow-up records.

## Phase 26 — Verification Checklists
Each role receives a checklist. Approval/forwarding is blocked until mandatory checks are complete.

## Phase 27 — Analytics 2.0
Add incidence, severity, trend, hotspot, treatment/recommendation, workflow turnaround and import quality metrics.

## Phase 28 — Offline/Mobile
Add local draft queue, retryable sync, conflict resolution and media upload queue.

## Phase 29 — Release
Run npm ci, tests, CI, staging smoke, backup/restore, rollback and protected production approval.
