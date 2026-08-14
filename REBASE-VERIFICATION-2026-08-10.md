# Rebase Verification — 2026-08-10

## Requested features

- [x] Keep `inter_farm_supervisor` role.
- [x] Keep `head_of_department` role.
- [x] Shared analytics dashboard for all authenticated roles.
- [x] All roles can open the scout report form.
- [x] All roles can create reports.
- [x] XLSX export.
- [x] XLSX import with validation and workflow-safe draft creation.
- [x] Admin add users.
- [x] Admin edit user roles.
- [x] Admin delete users with last-admin/self protection.
- [x] Automatic KPI cards.
- [x] Automatic bar charts.
- [x] Automatic monthly trend graph.
- [x] Workflow pie chart.
- [x] Recent reports table.
- [x] Browser print layout.
- [x] 60-second dashboard auto-refresh.

## Local packaging checks

- JavaScript syntax checks: PASS.
- Dependency-free XLSX round-trip test: PASS.
- Generated XLSX opened and re-saved by LibreOffice: PASS.
- Full `npm test`: not executable in the packaging container because npm runtime dependencies were not installed; run `npm ci` then `npm test` on the development machine.
