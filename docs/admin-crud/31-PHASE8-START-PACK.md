# Phase 8 Start Pack — Full Integration, Security & Regression QA

## Objective

Move from feature completion to end-to-end verification of the complete admin reference-data system and scout-facing compatibility.

## Required environment

- Install project dependencies with `npm install`.
- Provide a working PostgreSQL instance and valid `.env`.
- Apply the project schema/migrations.
- Create an admin user and a scout user for authorization tests.

## Test layers

1. API authentication: anonymous, scout, admin.
2. CRUD happy paths for all five reference domains.
3. Duplicate/validation errors.
4. Farm delete dependency protection.
5. Crop Type delete dependency protection.
6. Crop Variety parent scoping and immutable parent.
7. Pest/Disease historical observation independence.
8. Public `/api/reference/*` response compatibility.
9. Admin dashboard browser behavior.
10. Full `npm test` with dependencies installed.
11. Database transaction/concurrency checks.
12. Security headers, cookie/session behavior and authorization bypass attempts.

## Browser acceptance

Use a real browser against the running server and verify:

- Admin can load dashboard and reference records.
- Scout is redirected away from admin dashboard.
- Admin can create/edit/delete records.
- Delete conflicts show useful dependency messages.
- Crop varieties cannot be moved through edit.
- Refresh after mutation shows persisted state.
- Scout form still receives the existing public reference shapes.

## Exit criteria

- Full runtime suite green.
- End-to-end admin CRUD green.
- Public scout API regression green.
- No authorization bypass.
- No destructive cascade of historical scout reports.
- No breaking response-shape changes to `/api/reference/*`.
