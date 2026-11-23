# Phase 4 Start Pack — Crop Variety CRUD

## Objective

Implement admin-only CRUD for crop varieties while preserving the scout-facing crop-type/variety read API.

## Proposed endpoints

```text
GET    /api/admin/reference/crop-types/:cropTypeId/varieties
POST   /api/admin/reference/crop-types/:cropTypeId/varieties
GET    /api/admin/reference/crop-types/:cropTypeId/varieties/:id
PATCH  /api/admin/reference/crop-types/:cropTypeId/varieties/:id
DELETE /api/admin/reference/crop-types/:cropTypeId/varieties/:id
```

## Security

Reuse:

```js
auth.authenticate
auth.authorizeRoles("admin")
```

Expected:

```text
anonymous → 401
scout     → 403
admin     → allowed
```

## Database constraints to preserve

`crop_varieties.crop_type_id` references `crop_types.id` with `ON DELETE CASCADE`.

`UNIQUE (crop_type_id, name)` prevents duplicate variety names within a crop type.

## Required behavior

1. Validate parent crop type exists.
2. Validate variety name is non-empty and within the database length.
3. Reject duplicate variety names within the same crop type with 409.
4. If PATCH supports changing `crop_type_id`, validate the destination parent and destination uniqueness.
5. Prefer immutable parent context in the nested URL; do not silently move records across crop types.
6. Preserve `GET /api/reference/crop-types/:id/varieties` unchanged.
7. Add tests for anonymous, scout and admin authorization.
8. Add tests for missing parent, missing variety, duplicate variety, create, update and delete.
9. Re-run Phase 1, Phase 2 and Phase 3 verification after implementation.

## Scope boundary

Do not build the admin dashboard UI in Phase 4. Complete and stabilize the reference-data API layer first.
