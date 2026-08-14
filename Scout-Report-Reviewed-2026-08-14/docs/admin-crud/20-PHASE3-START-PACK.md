# Phase 3 Start Pack — Crop Type CRUD

## Objective

Extend the established admin reference CRUD foundation from Farms to Crop Types without changing the scout-facing read API.

## Endpoints

```text
GET    /api/admin/reference/crop-types
POST   /api/admin/reference/crop-types
GET    /api/admin/reference/crop-types/:id
PATCH  /api/admin/reference/crop-types/:id
DELETE /api/admin/reference/crop-types/:id
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

## Data-safety gate

The schema has:

```text
crop_varieties.crop_type_id
    → crop_types.id
    → ON DELETE CASCADE
```

Therefore the implementation must not expose an unconditional destructive crop-type delete.

Recommended behavior:

- lock crop type row;
- count child varieties;
- return `409 REFERENCE_IN_USE` when varieties exist;
- delete only when there are no child varieties.

## Test matrix

1. anonymous list → 401
2. scout list → 403
3. admin list → 200
4. admin create valid → 201
5. duplicate name → 409
6. get missing → 404
7. patch valid → 200
8. patch duplicate → 409
9. delete unused → 204
10. delete crop type with varieties → 409
11. `/api/reference/crop-types` remains unchanged
12. `/api/reference/crop-types/:id/varieties` remains functional

## Implementation rule

Do not build the dashboard UI in Phase 3. Stabilize the complete CRUD API for all reference domains first, then perform the UI phase.
