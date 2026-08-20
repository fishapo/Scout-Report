# Admin Dashboard — Analytics, Excel and User/Role Administration

## Purpose

The administrator dashboard is now the central management workspace. It combines report analytics, report import/export, printing, reference-data administration and user/role administration.

## Dashboard capabilities

### Analytics

The dashboard automatically reads `/api/dashboard` and renders:

- Total reports
- Critical reports
- Completed reports
- Pending reports
- Active farms
- Active users by application role
- Reports by crop
- Monthly report trend
- Workflow distribution pie chart
- Reports by farm
- Users by role
- Recent reports table

The dashboard refreshes its analytics after report imports and user/role changes. The existing dashboard startup also loads the analytics so the administrator sees current information immediately.

### Excel import/export

- **Export Excel** downloads the authenticated report dataset through `GET /api/reports/export.xlsx`.
- **Import Excel** uploads `.xlsx` through `POST /api/reports/import.xlsx`.
- Imported rows are validated by the normal report store and do not bypass the verification workflow.
- Import results show the number of accepted rows and validation failures.

### Printing

The **Print** buttons call the browser print dialog. A print stylesheet removes navigation, buttons and filters and lays out analytics cards/tables for paper/PDF output.

## User and role settings

The `User & Role Administration` section is embedded directly in the admin dashboard. It is protected twice:

1. The browser page requires the `admin` role.
2. The API `/api/admin/users/*` requires authenticated `admin` authorization.

### Supported roles

| Role | Purpose |
|---|---|
| `scout` | Creates and submits field reports. |
| `inter_farm_supervisor` | Verifies scout submissions and forwards them. |
| `head_of_department` | Performs the next verification stage. |
| `admin` | Performs final verification and manages users/system reference data. |

### User operations

Administrators can:

- Add a user.
- Assign a role at creation.
- Change an existing user's role.
- Delete a user.
- View active/inactive status.

The server prevents an administrator from removing their own administrator role, deleting their own account, or deleting the final active administrator account.

## API endpoints

### Analytics

`GET /api/dashboard`

### Reports

`GET /api/reports/export.xlsx`

`POST /api/reports/import.xlsx`

### User administration

`GET /api/admin/users`

`POST /api/admin/users`

`PATCH /api/admin/users/:id/role`

`DELETE /api/admin/users/:id`

## Verification

Run:

```bash
npm run verify:admin-ui
```

This verifies that the admin dashboard still contains the existing reference-data UI and the new analytics, Excel, printing and user/role administration controls.

For the complete regression suite:

```bash
npm test
```
