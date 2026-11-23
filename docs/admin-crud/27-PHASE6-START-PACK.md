# Phase 6 Start Pack — Disease CRUD

## Objective
Implement admin-only CRUD for the `diseases` reference table while preserving `GET /api/reference/diseases`.

## Source-derived baseline
The Phase 5 source inspection found `disease_observations.disease_type` is stored as text and the observation table has no foreign key to `diseases`. Confirm this again at Phase 6 start rather than assuming it.

## Endpoints

- `GET /api/admin/reference/diseases`
- `POST /api/admin/reference/diseases`
- `GET /api/admin/reference/diseases/:id`
- `PATCH /api/admin/reference/diseases/:id`
- `DELETE /api/admin/reference/diseases/:id`

## Rules

- Reuse `authenticate` and `authorizeRoles("admin")`.
- Preserve the public response shape exactly.
- Use server-generated `DISEASE-###` IDs if the actual schema remains unchanged.
- Name required, trimmed, max 255.
- Description optional.
- Duplicate name → 409.
- Missing record → 404.
- Delete → 204 if source verification confirms no FK dependency.
- Historical observations must not be rewritten or deleted by reference CRUD.

## Required verification

1. Inspect migration and store before coding.
2. Implement store/controller/routes/tests.
3. Run `verify:phase1` through `verify:phase6`.
4. Run focused CRUD tests.
5. Attempt full `npm test` and report dependency/environment limitations honestly.
6. Confirm `server/routes/reference.routes.js` remains unchanged.
