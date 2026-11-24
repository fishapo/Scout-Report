
> **Current milestone:** GitHub readiness, dependency hardening, deterministic migrations, PostgreSQL-backed CI, secure role workflow, and offline scout capture are implemented and verified.
# Scout Report

## Current release status

Scout Report is a Node.js and PostgreSQL field-reporting system with a four-stage approval flow:

1. A scout creates and submits a report.
2. The assigned Inter-Farm Supervisor verifies it.
3. The Head of Department verifies it and sends it to administration.
4. An administrator gives final approval; only approved reports enter global analytics.

Scouts retain report ownership. A supervisor may edit a report only when assigned and when the scout explicitly enabled supervisor editing. HOD review is read-only.

Browser authentication uses an HttpOnly session cookie. Browser code does not store or read JWT bearer tokens. Cookie-authenticated writes require a matching Origin. Explicit bearer authentication remains available for API clients.

The scout form supports offline capture after the application has first been loaded online. Pending reports synchronize when connectivity returns. See [Offline operation](#offline-operation) for current limitations.

The authoritative system, workflow, workbook, security, deployment, and operations reference is [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md). The compiled Word edition is [docs/Scout-Report-Master-Documentation.docx](docs/Scout-Report-Master-Documentation.docx).

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

The browser uses `previews/auth.js` with an HttpOnly cookie-backed session. Identity is held in memory, legacy browser tokens are removed on load, and authenticated requests use the cookie automatically.

1. Open `previews/login.html`.
2. Register or log in.
3. Select the appropriate operational role during onboarding where role selection is enabled. Elevated role changes remain admin-controlled.
4. After authentication, users are routed to the dashboard for their assigned role.
5. Logout revokes the server session, clears browser identity, and redirects to login.
## API Endpoints

Browser authentication uses the HttpOnly cookie. API clients may authenticate with an explicit bearer token:

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

The included GitHub Actions workflow (`.github/workflows/ci.yml`) installs dependencies, audits production packages, provisions PostgreSQL 16, applies all migrations, and runs the serial database-enabled test suite. Deployment is intentionally separate from CI and must be configured for the selected hosting platform.

The server listens on `process.env.PORT` (default 3000) and serves both the API and static previews.

### Environment Variables

Set these in Azure App Service Configuration, not in source control:

| Name | Required | Description |
|------|----------|-------------|
| `NODE_ENV` | Yes | Use `production` in Azure. |
| `PORT` | No | Azure normally injects this. Defaults to `3000` locally. |
| `DB_HOST` | Yes | PostgreSQL host name. |
| `DB_PORT` | Yes | Use `5433` for the included local Docker Compose service; hosted PostgreSQL commonly uses `5432`. |
| `DB_NAME` | Yes | Database name. |
| `DB_USER` | Yes | Database user. |
| `DB_PASSWORD` | Yes | Database password. |
| `JWT_SECRET` | Yes | Long random signing secret. Required in production. |
| `JWT_TTL_SECONDS` | No | JWT/session lifetime in seconds. Defaults to 8 hours. |
| `DB_SSL` | No | Set to `true` when the PostgreSQL provider requires TLS. |
| `DB_SSL_REJECT_UNAUTHORIZED` | No | Keep `true` unless the provider explicitly requires a private certificate exception. |
| `TRUST_PROXY_HOPS` | No | Trusted reverse-proxy hop count. Defaults to `0`. |

### Secrets Management

- Store database credentials and `JWT_SECRET` in the hosting platform secret store.
- Do not commit real `.env` files. Use `.env.example` as the local template.
- Rotate `JWT_SECRET` and database passwords after accidental exposure.

### CI/CD Verification

The workflow uses `npm ci`, rejects known moderate-or-higher production vulnerabilities, migrates a clean PostgreSQL service, and runs `npm run test:ci` with database integration enabled.

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

The migration runner always applies `init.sql` first on a fresh database, then applies the numbered migrations in lexical order. Existing reports are upgraded without rewriting their report content.

### Administrator role management

- `GET /api/admin/users` — list users (admin only)
- `PATCH /api/admin/users/:id/role` — assign `scout`, `inter_farm_supervisor`, `head_of_department` or `admin` (admin only)
- `/admin-users` — browser role-management page for administrators
- `/admin-verification-dashboard` — final verification queue


## Analytics dashboard

Global analytics and its API are admin-only. Reports enter analytics only after supervisor verification, HOD verification and sharing, and final administrator approval. Scouts, supervisors and HOD users retain their role-specific workflow dashboards without access to global analytics.

## Offline operation

After one successful online load, the service worker caches the scout form and required static assets. A report submitted without connectivity is placed in IndexedDB and retried when the browser returns online.

Current production limitations:

- Keep one scout account per browser profile until queued reports are explicitly user-scoped.
- Do not clear browser storage while reports are pending.
- Offline synchronization currently prioritizes the primary report payload; verify extended evidence after synchronization.
- A lost server response can cause a retry, so administrators should check for duplicates until idempotency keys are enforced.

These limitations are tracked as the next offline-hardening work and should be resolved before shared-device deployment.

## Excel

Authenticated roles can export/import reports from the shared dashboard. Export produces a real `.xlsx` workbook. Imports are validated by the normal report store and become workflow drafts owned by the importing user.

## User administration

Administrators can use `/admin-users` to add users, change roles among `scout`, `inter_farm_supervisor`, `head_of_department`, and `admin`, and delete users.


This package includes the 11 Aug 2026 next-phase data-model and import/reconciliation plan under docs/next-phases/.

## HOD login remediation (Phase 22)

The application includes the `head_of_department` role and `/head-of-department-dashboard`. Elevated roles are assigned by administrators through `/admin-users`. If an existing HOD account such as `lathyflora69@gmail.com` returns `Invalid email or password`, the administrator can use **Reset Password** on `/admin-users`; the reset preserves the HOD role and revokes existing sessions. See `docs/workflow/PHASE22-HOD-AUTH-REMEDIATION-2026-08-12.md`.
