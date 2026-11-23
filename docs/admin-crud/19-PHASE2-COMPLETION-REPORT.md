# Phase 2 Completion Report — Admin Reference CRUD API Foundation

## Status

**COMPLETE** for source implementation, focused tests, route/security verification, syntax verification and static UI verification.

## Implemented entity

**Farms**

## API

```text
GET    /api/admin/reference/farms
POST   /api/admin/reference/farms
GET    /api/admin/reference/farms/:id
PATCH  /api/admin/reference/farms/:id
DELETE /api/admin/reference/farms/:id
```

## Security

All farm routes use the existing:

```text
auth.authenticate
→ auth.authorizeRoles("admin")
```

The existing `/api/reference/*` router remains separate.

## Farm deletion safety

The schema has:

```text
scout_reports.farm_id → farms.id → ON DELETE CASCADE
```

The implementation therefore:

1. locks the farm row with `FOR UPDATE`;
2. counts dependent scout reports;
3. returns an in-use result when dependencies exist;
4. deletes only when the farm has no report dependencies.

Expected API behavior:

| Condition | Result |
|---|---:|
| Anonymous | 401 |
| Scout | 403 |
| Admin list/create/update | allowed |
| Missing farm | 404 |
| Duplicate | 409 |
| Referenced farm delete | 409 / `REFERENCE_IN_USE` |
| Unused farm delete | 204 |

## Verification

- Phase 1 verification: **29/29 passed**.
- Phase 2 verification: **28/28 passed**.
- Focused Phase 2 tests: **9/9 passed**.
- Admin dashboard static verifier: **passed**.
- Phase 2 Node syntax checks: **passed**.
- Scout-facing `server/routes/reference.routes.js`: byte-for-byte unchanged from the Phase 1 hash baseline.

## Full-suite limitation

`npm test` was attempted. The execution environment does not have the project's npm dependencies installed. The run discovered 38 tests: 24 passed and 14 failed, with failures including `MODULE_NOT_FOUND: express` from application tests. This is explicitly recorded as an environment limitation; the full suite is **not** claimed as passing.

## Files introduced/changed

- `server/routes/admin/reference.routes.js`
- `server/controllers/admin/reference.controller.js`
- `server/farm.store.test.js`
- `server/admin-reference.controller.test.js`
- `server/store.js`
- `server/routes/index.js`
- `scripts/verify-phase1.js`
- `scripts/verify-phase2.js`
- `package.json`
- Phase 2 documentation and verification artifacts

## Next measure

### Phase 3 — Crop Type CRUD

Implement:

```text
GET    /api/admin/reference/crop-types
POST   /api/admin/reference/crop-types
GET    /api/admin/reference/crop-types/:id
PATCH  /api/admin/reference/crop-types/:id
DELETE /api/admin/reference/crop-types/:id
```

Preserve `/api/reference/crop-types` exactly as the scout-facing read contract.

Because `crop_varieties.crop_type_id` uses `ON DELETE CASCADE`, crop-type deletion must use the same dependency-safety approach established for Farms.
