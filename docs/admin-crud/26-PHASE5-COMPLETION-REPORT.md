# Phase 5 Completion Report — Pest CRUD

Date: 2026-08-08
Status: COMPLETE

## Objective
Implement admin-only CRUD for the `pests` reference table while preserving the existing scout-facing `GET /api/reference/pests` contract.

## Source inspection finding
The actual migration defines:

- `pests.id` as `VARCHAR(50)` primary key.
- `pests.name` as `VARCHAR(255) NOT NULL UNIQUE`.
- `pests.description` as `TEXT`.
- `pest_observations.pest_type` as `VARCHAR(255) NOT NULL`.
- `pest_observations` has no foreign key to `pests`.

Therefore historical observations store the pest name as text. Removing a pest reference row does not cascade-delete historical observations. New/updated reports still validate pest names against the reference table through `resolveReferenceName()`.

## Implemented endpoints

- `GET /api/admin/reference/pests`
- `POST /api/admin/reference/pests`
- `GET /api/admin/reference/pests/:id`
- `PATCH /api/admin/reference/pests/:id`
- `DELETE /api/admin/reference/pests/:id`

All use the existing `authenticate` + `authorizeRoles("admin")` middleware.

## CRUD behavior

- IDs are server-generated as `PEST-###` under a transaction advisory lock.
- Names are required, trimmed, max 255 characters.
- Descriptions are optional and normalized to `null` when empty.
- Duplicate names map to HTTP 409 through the existing database-error normalization.
- Missing records map to HTTP 404 at the controller.
- Successful deletion returns HTTP 204.

## Important corrective refactor
During inspection of the Phase 4 ZIP, the admin route module had `module.exports = router` before the later Crop Type/Crop Variety declarations. That meant the later route declarations were operating on an internal router reference after export and were not reliably represented by the exported module. Phase 5 moves `module.exports = router` to the end of the route file and adds an explicit verification check for this condition.

This is included as a Phase 5 corrective hardening change because the objective is a working admin CRUD layer, not merely static route declarations.

## Verification

### Static verification

`node scripts/verify-phase5.js`

- Checks: 29
- Passed: 29
- Failed: 0

### Regression verification

- Phase 1: 29/29 PASS
- Phase 2: 28/28 PASS
- Phase 3: 22/22 PASS
- Phase 4: 28/28 PASS
- Phase 5: 29/29 PASS

### Focused CRUD tests

23 tests passed across Farms, Crop Types, Crop Varieties and Pests.

### Full npm test

55 tests discovered:

- 41 passed
- 14 failed

The 14 failures are execution-environment dependency failures (`MODULE_NOT_FOUND` for `express` and `dotenv`) rather than reported Phase 5 logic failures. The complete suite is therefore not claimed green.

## Next measure

### Phase 6 — Disease CRUD

Implement the same admin-only CRUD layer for `diseases`, after confirming the actual disease observation relationship. The migration currently indicates `disease_observations.disease_type` is text and does not FK the diseases table, so the expected deletion policy is analogous to Pests, subject to final source verification.

Endpoints:

- `GET /api/admin/reference/diseases`
- `POST /api/admin/reference/diseases`
- `GET /api/admin/reference/diseases/:id`
- `PATCH /api/admin/reference/diseases/:id`
- `DELETE /api/admin/reference/diseases/:id`

Do not build the admin UI yet. Finish and verify the backend reference-data API first.
