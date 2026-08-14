# Scout Report — Complete Admin CRUD Development Plan

See `docs/admin-crud/00-PLAN-INDEX.md` for the full implementation package.

## Executive decision

Add a new admin-only namespace:

`/api/admin/reference/*`

while keeping these scout-facing endpoints unchanged:

`/api/reference/*`

Reuse the existing `server/auth.js` authorization:

`authenticate` → `authorizeRoles("admin")`

Start with schema/dependency verification and Farms because the current database schema has:

`scout_reports.farm_id REFERENCES farms(id) ON DELETE CASCADE`

Therefore unrestricted farm deletion is unsafe.

Implementation sequence:

1. Baseline
2. Schema/dependency audit
3. Admin API foundation
4. Farm CRUD
5. Crop Type CRUD
6. Variety CRUD
7. Pest CRUD
8. Disease CRUD
9. Admin dashboard
10. Full regression
11. Audit trail
12. Performance

The detailed source analysis, API contract, database analysis, security plan, UI plan, test plan, risks and ready-to-use next-development prompt are in `docs/admin-crud/`.

---

## Implementation Status Update — 2026-08-08

### Phase 1 — COMPLETE
Schema/dependency audit verified. The farm cascade safety gate and reference relationships were established.

### Phase 2 — COMPLETE
Admin Reference CRUD API foundation implemented for **Farms**. Verified:

- Phase 1: 29/29 checks passed
- Phase 2: 28/28 checks passed
- Focused Phase 2 tests: 9/9 passed
- Admin dashboard static verification: passed
- Scout-facing `server/routes/reference.routes.js`: unchanged

### Next measure — Phase 3
Crop Type CRUD. See `docs/admin-crud/20-PHASE3-START-PACK.md`.
