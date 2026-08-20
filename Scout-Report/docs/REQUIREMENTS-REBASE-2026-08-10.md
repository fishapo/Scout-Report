# Scout Report — Role & Analytics Rebase (2026-08-10)

## New business requirements

1. Keep all workflow roles: `scout`, `inter_farm_supervisor`, `head_of_department`, `admin`.
2. Every authenticated role can open the shared analytics dashboard.
3. Every authenticated role can open the scout-report form and create a new report.
4. Reports continue through mandatory verification gates: Scout → Inter-Farm Supervisor → Head of Department → Administrator.
5. Dashboard analytics update automatically from PostgreSQL data.
6. Dashboard supports bar charts, trend graph, workflow pie, tables and browser printing.
7. Authenticated users can export reports to real `.xlsx` files.
8. Authenticated users can import `.xlsx` files using the exported/template column structure. Imported reports are created as drafts owned by the importing user; workflow verification is not bypassed.
9. Administrators can add users, edit roles and delete users. The last active administrator and the current administrator account are protected.

## Compatibility

Existing canonical `/api/reports` ownership rules and workflow endpoints remain intact. The new `/api/dashboard` endpoint is a separate analytics surface so the existing security tests for report ownership do not need to be weakened.

10. Dashboard data refreshes automatically every 60 seconds while the page is open.
