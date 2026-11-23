# 13. Ready-to-Use Next Development Prompt

Continue development of the Scout Report project from the supplied project snapshot.

First inspect the current files before changing anything.

The objective is to implement Phase 2 of the attached Admin Reference Data CRUD Plan.

Hard requirements:

1. Preserve all existing `/api/reference/*` endpoints and response shapes.
2. Do not rewrite `server/controllers/reference.controller.js` or `server/routes/reference.routes.js` unless an actual blocking defect is demonstrated.
3. Reuse `server/auth.js`:
   - `authenticate`
   - `authorizeRoles("admin")`
4. Add new administrative endpoints under:
   `/api/admin/reference/*`
5. Start with Farms only.
6. Inspect the actual database schema and current store before implementing.
7. Do not blindly expose `DELETE /farms/:id` because `scout_reports.farm_id` currently has `ON DELETE CASCADE`.
8. Implement repository/service/controller separation if that improves maintainability without rewriting unrelated report code.
9. Add tests for:
   - anonymous → 401
   - scout → 403
   - admin → allowed
   - valid create
   - invalid create
   - duplicate create
   - get
   - update
   - missing record
   - dependency-safe deletion
   - existing `/api/reference/farms` regression
10. Run the complete existing test suite after the new tests.
11. Do not change the scout form contract.
12. Provide exact Git/Termux commit commands after each completed phase.

Before coding, produce a short file-by-file change list based on the actual current files. Then implement only the first safe phase.
