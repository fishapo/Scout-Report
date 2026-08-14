
> **Current milestone:** Phase 28 form submission/reference-alignment fix complete. Pest and disease observations now resolve against live PostgreSQL reference IDs before report submission; focused form/reference tests pass. Full npm test execution remains environment-dependent until npm dependencies are installed.
# Scout-Report

Combined scout reports for @LathyFlora — pest and disease monitoring for agricultural farms.

## Quick Start

```bash
npm ci
npm start
```

Open [./previews/](./previews/) for the preview hub, or go directly to:

- [./previews/login.html](./previews/login.html) — Login and registration page
- [./previews/user-form.html](./previews/user-form.html) — Scout report submission form (requires login)
- [./previews/admin-dashboard.html](./previews/admin-dashboard.html) — Admin dashboard (requires admin login)
## Browser Login Flow

The preview UI uses `previews/auth.js` to store an authenticated session in `sessionStorage` and automatically attach `Authorization: Bearer <token>` headers to protected API requests.

1. Open `previews/login.html`.
2. Register or log in.
3. The first registered user becomes `admin`; later users default to `scout`.
4. After successful auth, admins are redirected to `admin-dashboard.html`; scouts are redirected to `user-form.html`.
5. All protected preview requests call the backend with the JWT bearer token, and logout revokes the session on the server while clearing local browser state.
## API Endpoints

Authentication uses Bearer JWTs. Register or log in, then send:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a user. The first registered user becomes `admin`; later users default to `scout`. |
| POST | `/auth/login` | Log in and receive a JWT plus session expiry. |
| POST | `/auth/logout` | Revoke the current session. Requires authentication. |
| GET | `/auth/me` | Get the current authenticated user/session. |
| GET | `/farms` | List available farms |
| GET | `/crop-types` | List crop types |
| GET | `/crop-types/:id/varieties` | Varieties for a crop type |
| GET | `/pests` | List common pests |
| GET | `/diseases` | List common diseases |
| GET | `/scout-reports` | List reports. Requires authentication. Supports `farm`, `status`, `dateFrom`, `dateTo`, `limit`, `offset`. |
| GET | `/scout-reports/stats` | Dashboard statistics. Requires `admin`. |
| GET | `/scout-reports/:id` | Get a single report. Requires authentication. |
| GET | `/auth/me` | Refresh current session and user info in the browser. Requires authentication. |
| POST | `/scout-reports` | Create a new scout report. Requires `admin` or `scout`. |
| PATCH | `/scout-reports/:id` | Update report fields. Requires `admin`. |
| POST | `/scout-reports/:id/pest-observations` | Add pest observation to a report. Requires `admin` or `scout`. |
| POST | `/scout-reports/:id/disease-observations` | Add disease observation to a report. Requires `admin` or `scout`. |
| DELETE | `/scout-reports/:id` | Delete a report. Requires `admin`. |

## Phase 28 — Form Pest/Disease Submission Fix (2026-08-14)

The current Scout Report form was displaying live pest/disease reference dropdowns, but the master observation builder submitted spreadsheet labels directly as `pestType` / `diseaseType`. Several labels do not exactly match the PostgreSQL master reference names (for example `Caterpillar` vs `Cater Pillar`, `Botrytis` vs `Botrytis Spots/Mp`). PostgreSQL therefore rejected valid observations with errors such as `Valid pest type is required`.

Phase 28 fixes this by:

- Loading the live pest and disease reference arrays into the form.
- Resolving each populated master observation to its authoritative reference **ID** before POST `/api/reports`.
- Supporting controlled spelling/spacing aliases for master spreadsheet headings.
- Failing early with a precise reference-configuration message if a populated observation has no matching live reference.
- Keeping the visible reference dropdowns and the 38-column master observation structure intact.
- Extracting the reference-resolution logic into `previews/js/reference-mapping.js` so it can be unit-tested independently.

Focused verification:

```bash
node --test previews/master-reference.test.js
```

Expected result: **8 tests passing**.

The full suite requires the declared npm dependencies to be installed first:

```bash
npm ci
npm test
```

See `docs/PHASE28-PEST-DISEASE-SUBMISSION-FIX-2026-08-14.md` for the implementation and verification record.

## Security

- Passwords are stored as PBKDF2-SHA256 hashes with per-password salts.
- JWTs are signed with HS256 and backed by database sessions so logout can revoke access.
- Set `JWT_SECRET` in production. The development fallback must not be used for deployed systems.
- Roles: `admin` can view stats, update, and delete reports; `scout` can create reports and add observations.

## Project Structure

```
Scout-Report/
├── previews/           # HTML UI (form, dashboard, preview hub)
├── server/
│   ├── index.js        # Express API server
│   ├── auth.js         # Authentication, password hashing, JWT, sessions, RBAC
│   ├── store.js        # PostgreSQL-backed report/reference store
│   └── migrations/
│       └── init.sql    # Database schema, constraints, indexes, seed reference data
└── package.json
```

## Development

```bash
npm run dev    # Start reliably without a filesystem watcher
npm run dev:watch # Optional legacy nodemon watcher
npm test       # Run unit tests
npm run verify:phase9  # Production-hardening/reproducibility checks
npm run release:check  # Release gate alias
```

## Deployment

The included GitHub Actions workflow (`.github/workflows/azure-webapps-node.yml`) verifies and deploys to Azure App Service. Configure:

1. Set `AZURE_WEBAPP_NAME` in the workflow file
2. Add `AZURE_WEBAPP_PUBLISH_PROFILE` as a repository secret
3. Configure App Service application settings for the environment variables below
4. Enable HTTPS Only in the Azure App Service TLS/SSL settings

The server listens on `process.env.PORT` (default 3000) and serves both the API and static previews.

### Environment Variables

Set these in Azure App Service Configuration, not in source control:

| Name | Required | Description |
|------|----------|-------------|
| `NODE_ENV` | Yes | Use `production` in Azure. |
| `PORT` | No | Azure normally injects this. Defaults to `3000` locally. |
| `DB_HOST` | Yes | PostgreSQL host name. |
| `DB_PORT` | Yes | PostgreSQL port, usually `5432`. |
| `DB_NAME` | Yes | Database name. |
| `DB_USER` | Yes | Database user. |
| `DB_PASSWORD` | Yes | Database password. |
| `JWT_SECRET` | Yes | Long random signing secret. Required in production. |
| `JWT_TTL_SECONDS` | No | JWT/session lifetime in seconds. Defaults to 8 hours. |
| `ENFORCE_HTTPS` | No | Defaults to HTTPS redirects in production. Set `false` only for trusted private test slots. |

### Secrets Management

- Store `AZURE_WEBAPP_PUBLISH_PROFILE` as a GitHub Actions repository secret.
- Store database credentials and `JWT_SECRET` in Azure App Service app settings or Key Vault references.
- Do not commit real `.env` files. Use `.env.example` as the local template.
- Rotate `JWT_SECRET` and database passwords after accidental exposure.

### CI/CD Verification

The workflow uses `npm ci`, runs `npm run verify`, uploads a deployment artifact without test files or local report data, deploys to Azure, then calls `/api/health` on the deployed app.

### HTTPS, Monitoring, And Logging

- Enable Azure App Service "HTTPS Only".
- The app also redirects forwarded HTTP requests to HTTPS in production and emits HSTS.
- `/api/health` reports database connectivity for deployment smoke tests and monitoring probes.
- Requests are logged as structured JSON with `requestId`, method, path, status, duration, and authenticated user id when available.
- Forward App Service logs to Azure Monitor or Application Insights for retention, alerts, and dashboards.

## Contact

isaacmunyua01@gmail.com

## Current Development Milestone

Phase 18 establishes the executable release/staging/DR/rollback gate, checksum validation, local runtime acceptance evidence, protected deployment boundaries, and the Phase 19 measured-reliability handoff. See [NEXT-DEV-STEP.md](./NEXT-DEV-STEP.md) for the current milestone and next measure.

## Production Operations

Phase 11 operational runbooks are under `ops/` and `docs/operations/`:
- Monitoring and alerting: `ops/monitoring.md`
- PostgreSQL backup/recovery: `ops/backup-recovery.md`
- Incident response/rollback: `ops/incident-response.md`
- Maintenance policy: `ops/maintenance-policy.md`
- Support handover: `ops/support-handover.md`

Run the operational source gate with:

```bash
npm run verify:phase11
```

## CI/CD and Observability

- CI/CD: `docs/CI-CD.md`
- Runtime metrics: `/api/admin/metrics` (admin-only)
- Observability configuration: `ops/observability/config.yml`
- Phase 12 verification: `npm run verify:phase12`
- Release artifact: `npm run release:artifact`

## Multi-stage report verification workflow

The application now preserves the existing `scout` and `admin` roles and adds two operational workflow roles:

- `scout` — creates field reports and submits them to an Inter-Farm Supervisor.
- `inter_farm_supervisor` — verifies scout reports and, only after verification, shares them with the Head of Department.
- `head_of_department` — verifies supervisor-verified reports and, only after verification, shares them with an Administrator.
- `admin` — performs final verification and approval.

Every share and verification is recorded in `report_workflow_events`. Reports cannot skip a verification gate. Rejected reports move back one stage for correction, preserving the audit trail.

### Workflow API

- `GET /api/workflow/inbox`
- `GET /api/workflow/:id`
- `GET /api/workflow/recipients/:role`
- `POST /api/workflow/:id/share`
- `POST /api/workflow/:id/verify`

### Database migration

Run:

```bash
npm run migrate
```

The migration runner applies all SQL files in `server/migrations/` in lexical order, including `002_report_workflow.sql`. Existing reports are initialized into the workflow without rewriting their report content.

### Administrator role management

- `GET /api/admin/users` — list users (admin only)
- `PATCH /api/admin/users/:id/role` — assign `scout`, `inter_farm_supervisor`, `head_of_department` or `admin` (admin only)
- `/admin-users` — browser role-management page for administrators
- `/admin-verification-dashboard` — final verification queue


## Shared Analytics Dashboard

All authenticated application roles can open `/dashboard.html`. The dashboard reads `/api/dashboard` and renders automatic KPI cards, crop/farm charts, monthly trends, workflow pie distribution, recent reports and a print-friendly report view.

## Excel

Authenticated roles can export/import reports from the shared dashboard. Export produces a real `.xlsx` workbook. Imports are validated by the normal report store and become workflow drafts owned by the importing user.

## User administration

Administrators can use `/admin-users` to add users, change roles among `scout`, `inter_farm_supervisor`, `head_of_department`, and `admin`, and delete users.


This package includes the 11 Aug 2026 next-phase data-model and import/reconciliation plan under docs/next-phases/.

## HOD login remediation (Phase 22)

The application includes the `head_of_department` role and `/head-of-department-dashboard`. Elevated roles are assigned by administrators through `/admin-users`. If an existing HOD account such as `lathyflora69@gmail.com` returns `Invalid email or password`, the administrator can use **Reset Password** on `/admin-users`; the reset preserves the HOD role and revokes existing sessions. See `docs/workflow/PHASE22-HOD-AUTH-REMEDIATION-2026-08-12.md`.
