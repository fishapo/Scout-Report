# Phase 5 Start Pack — Pest CRUD

## Objective
Implement admin-only CRUD for the `pests` reference table while keeping the scout-facing read API stable.

## Proposed endpoints

- `GET /api/admin/reference/pests`
- `POST /api/admin/reference/pests`
- `GET /api/admin/reference/pests/:id`
- `PATCH /api/admin/reference/pests/:id`
- `DELETE /api/admin/reference/pests/:id`

## Required investigation before coding

1. Confirm the exact pest observation schema and whether historical observations store `pest_type` as text or an ID.
2. Preserve the existing `GET /api/reference/pests` response shape.
3. Inspect uniqueness and deletion implications in the real schema.
4. Decide whether delete must be dependency-protected or whether historical text storage makes it safe.

## Security

Reuse `auth.authenticate` and `auth.authorizeRoles("admin")`.

Expected:

- anonymous → 401
- scout → 403
- admin → allowed

## CRUD behavior

- IDs remain server-generated using the established `PEST-###` convention unless the actual project schema requires otherwise.
- Name required, trimmed, maximum 255 characters.
- Description optional and length constrained only if the schema requires it.
- Duplicate names → 409.
- Missing records → 404.
- Successful delete → 204, subject to the verified dependency policy.

## Scope boundary

Do not build the admin dashboard CRUD UI yet. Complete the backend reference-data API first.
