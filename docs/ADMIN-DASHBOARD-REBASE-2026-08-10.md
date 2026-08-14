# Admin Dashboard Rebase — 2026-08-10

## Change request addressed

The administrator dashboard now includes the same management-grade analytics experience expected of the shared dashboard, together with Excel import/export, printing and direct user-role administration.

## Changes

- Added administrator analytics KPIs and charts.
- Added workflow pie chart and recent-report analytics table.
- Added users-by-role chart.
- Added Excel export control to the administrator dashboard.
- Added Excel import control to the administrator dashboard.
- Added print controls and print-specific CSS.
- Added embedded user creation form.
- Added embedded role editing controls.
- Added embedded user deletion controls.
- Preserved all four application roles.
- Preserved existing reference-data CRUD UI.
- Preserved existing report and verification routes.
- Added a static admin UI verification script.
- Bumped application version to `2.2.0`.

## Files changed

- `previews/admin-dashboard.html`
- `scripts/verify-admin-management.js`
- `package.json`
- `docs/ADMIN-DASHBOARD-ANALYTICS-AND-ROLE-MANAGEMENT.md`
- `docs/ADMIN-USER-ROLE-OPERATIONS.md`
- `docs/ADMIN-DASHBOARD-REBASE-2026-08-10.md`

## Existing server support reused

The previous rebase already contains the protected APIs for:

- `/api/dashboard`
- `/api/reports/export.xlsx`
- `/api/reports/import.xlsx`
- `/api/admin/users`
- `/api/admin/users/:id/role`
- `/api/admin/users/:id`

No role was removed.
