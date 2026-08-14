# Scout Report: Project Documentation

**Version audited:** 2.0.0  
**Audit date:** 6 August 2026  
**Technology:** Node.js 18+, Express 4, PostgreSQL, static HTML/CSS/JavaScript browser client

## 1. Purpose

Scout Report is an agricultural scouting application for recording pest and disease observations at farms. It gives scouts a structured way to submit field reports and gives administrators a browser dashboard for viewing, filtering, reviewing, and managing reports.

The application is a single Node.js service. It serves both the JSON API and the browser pages, and persists operational data in PostgreSQL.

## 2. Current capability at a glance

| Area | Current status | What is available |
| --- | --- | --- |
| Browser access | Present | Login, registration, session persistence, logout, route protection in the UI |
| Scout reporting | Present | Farm/crop selection, environmental data, GPS coordinates, pest and disease observations, validation and submission |
| Administration | Present | Dashboard metrics, filters, paginated report list, detail view and deletion |
| Report API | Present | Authenticated read/create/update/delete operations and observation endpoints |
| Reference data | Present | Farms, crop types, varieties, pests and diseases from PostgreSQL |
| Authentication | Present | PBKDF2 password hashes, signed JWTs, server-side revocable sessions, role checks and login throttling |
| PostgreSQL schema | Present | Tables, constraints, indexes and seed reference data |
| Docker and CI | Present | PostgreSQL Compose service and GitHub Actions Azure deployment workflow |
| Report ownership/workflow | Present | Scout → Inter-Farm Supervisor → Head of Department → Administrator verification workflow with audit events |
| Import/export | Present | XLSX import/export paths with canonical report mapping and validation |

## 3. User roles and journeys

### Admin

The first account registered becomes an `admin`. Admins can:

- Sign in and retain the authenticated browser session for the current browser session.
- View the dashboard and its aggregate metrics.
- Read and filter all reports.
- Create reports.
- Partially update report weather, temperature, humidity, notes, or status.
- Delete reports.
- Add pest and disease observations.

### Scout

Subsequent self-registered accounts default to `scout`. Scouts can:

- Sign in, log out and access the report form.
- Load farms, crops, varieties, pests and diseases.
- Create reports and add observations.
- Call the authenticated report list/detail endpoints.

> Important: the API currently allows every authenticated user to list and fetch every report. A report has no `owner_id`, so the system does not yet enforce scout-only visibility or ownership.

### Registration rules

- Registration and login are public routes.
- The first registered user receives the `admin` role.
- Later public registrations receive `scout` unless an authenticated admin explicitly supplies a valid role.
- Passwords must meet the server-side complexity rules (at least eight characters, with letters and numbers).
- Authentication attempts are limited to 10 per IP address and route over 15 minutes.

## 4. Browser application

The Express application serves the contents of `previews/` from the site root.

| Page | Purpose | Access behavior |
| --- | --- | --- |
| `index.html` | Preview/navigation hub | Public, but it is a showcase rather than an authenticated application home |
| `login.html` | Login and registration | Public; routes admins to the dashboard and scouts to the form |
| `user-form.html` | Scout report submission | Calls `/auth/me` on load and redirects unauthenticated users to login |
| `admin-dashboard.html` | Report management dashboard | Calls `/auth/me`; the API independently limits dashboard metrics and destructive actions to admins |

### Authentication in the browser

`previews/auth.js` is the shared browser authentication helper. It:

- Stores the token and basic user data in `sessionStorage` under `scout-report-auth`.
- Restores that state when the page reloads.
- Validates a restored token through `GET /auth/me`.
- Adds `Authorization: Bearer <token>` through `fetchWithAuth`.
- Clears state and redirects to `login.html` after a `401` response.
- Calls server logout before clearing local state where possible.

Session storage keeps a user signed in only until the browser session ends. It is not a long-lived "remember me" implementation.

### Scout report form

The form loads reference data from the API and supports:

- Farm selection and the Field/Greenhouse flag.
- Crop type selection and dynamically loaded varieties.
- Report date and implementation week/year.
- Weather, temperature and humidity.
- Optional latitude/longitude location.
- Any number of pest observations: pest type, count, severity, affected percentage, plant location and notes.
- Any number of disease observations: disease type, severity, affected percentage, spot count, colour and notes.
- Notes and client-side feedback on submission errors.

The server remains authoritative: it validates that the farm, crop variety, pest and disease actually exist in the reference tables.

### Admin dashboard

The dashboard loads:

- Summary metrics: total reports, critical issues, active farms and response rate.
- A report list filtered by farm, status and date range.
- Individual report details, including observations.
- Admin-only deletion.

The dashboard applies pagination using `limit` and `offset`. The backend defaults to 100 reports and accepts at most 500 per request.

## 5. Report lifecycle and status rules

Reports contain farm, crop, environment, location, notes, observations, status, and timestamps.

The service derives the report status when observations are created:

| Observation severity | Derived report status |
| --- | --- |
| Any `Critical` observation | `Critical` |
| Any `High` observation, with no critical observation | `Pending` |
| Only Low/Medium observations | `Pending` |
| No observations | `Completed` |

An admin can also explicitly set `status` to `Pending`, `Completed`, or `Critical` through the partial-update endpoint.

## 6. API contract

All routes below are mounted at the application root. The API does **not** use `/api` as a universal prefix. The two API-prefixed informational endpoints are `/api` and `/api/health`.

### Public and health routes

| Method | Route | Result |
| --- | --- | --- |
| `GET` | `/` | Static preview hub |
| `GET` | `/health` | Basic service heartbeat without a database check |
| `GET` | `/api` | API identity/version response |
| `GET` | `/api/health` | PostgreSQL-aware health response; returns 503 when the database is unavailable |
| `POST` | `/auth/register` | Register and immediately receive a session token |
| `POST` | `/auth/login` | Authenticate and receive a session token |
| `GET` | `/farms` | Farms |
| `GET` | `/crop-types` | Crop types with varieties |
| `GET` | `/crop-types/:id/varieties` | Varieties for a crop type |
| `GET` | `/pests` | Pest reference data |
| `GET` | `/diseases` | Disease reference data |

### Authenticated routes

Send a token with `Authorization: Bearer <token>`.

| Method | Route | Required role | Result |
| --- | --- | --- | --- |
| `POST` | `/auth/logout` | Signed-in user | Revokes the current server-side session |
| `GET` | `/auth/me` | Signed-in user | Current user and session expiry |
| `GET` | `/scout-reports` | Signed-in user | Filtered and paginated report collection |
| `GET` | `/scout-reports/:id` | Signed-in user | One report and its observations |
| `POST` | `/scout-reports` | Admin or scout | Create a report with optional observations |
| `POST` | `/scout-reports/:id/pest-observations` | Admin or scout | Add one pest observation and refresh derived status |
| `POST` | `/scout-reports/:id/disease-observations` | Admin or scout | Add one disease observation and refresh derived status |
| `GET` | `/scout-reports/stats` | Admin | Dashboard metrics |
| `PATCH` | `/scout-reports/:id` | Admin | Update selected report fields |
| `DELETE` | `/scout-reports/:id` | Admin | Delete a report and cascading observations |

### List filters

`GET /scout-reports` and `GET /scout-reports/stats` accept these optional parameters:

- `farm`: farm ID or name; `all` means no farm filter.
- `status`: `Pending`, `Completed`, `Critical`, or `all`.
- `dateFrom` and `dateTo`: ISO dates.
- `limit`: 1 to 500 (list route only).
- `offset`: 0 or greater (list route only).

### Response and error behavior

Successful report/reference handlers generally return raw arrays or objects, not a common `{ data: ... }` wrapper. Expected validation, authentication and not-found errors return `{ "error": "..." }`; unexpected errors are returned as HTTP 500 with the safe message `Internal server error`.

## 7. Data model

PostgreSQL is the source of truth. The schema in `server/migrations/init.sql` creates:

| Table | Responsibility |
| --- | --- |
| `farms` | Farm ID, name and location |
| `crop_types` | Crop catalogue |
| `crop_varieties` | Varieties belonging to a crop type |
| `pests` | Pest catalogue |
| `diseases` | Disease catalogue |
| `users` | User identity, password hash, role and active flag |
| `user_sessions` | Revocable JWT-backed sessions |
| `scout_reports` | Main report record |
| `pest_observations` | Pest observations for a report |
| `disease_observations` | Disease observations for a report |

The schema provides foreign keys, range/enum-like check constraints, indexes for common report queries, and seed reference data for three farms, four crop types, five pests, and five diseases.

Report creation and observation addition run inside database transactions. Deleting a report cascades to its observations.

## 8. Architecture

```text
Browser pages (previews/)
  -> browser auth helper (sessionStorage + bearer token)
  -> Express application (server/app.js)
       -> routes -> controllers -> store -> PostgreSQL
       -> security headers, structured request logging, error handler
       -> static delivery of browser pages
```

Key modules:

- `server/index.js`: startup, production environment checks, port fallback, graceful shutdown.
- `server/app.js`: Express configuration, static client delivery, middleware and route mounting.
- `server/auth.js`: password hashing, JWT signing/verification, session checks and RBAC.
- `server/store.js`: validated PostgreSQL read/write operations and report-status derivation.
- `server/db.js`: connection pool, transactions and health check.
- `server/migrations/init.sql`: initial schema and seed data.

## 9. Security and operational behavior

### Present controls

- Passwords use PBKDF2-SHA256 with a per-password salt and 310,000 iterations.
- Access tokens are HS256-signed JWTs and are validated against a live, non-revoked session record.
- Logout revokes the current session in PostgreSQL.
- Protected routes use authentication middleware and role checks.
- Login/register attempts have an in-memory rate limiter.
- Request logs are structured JSON and include a request ID.
- Security headers include `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`; production adds HSTS and redirects forwarded HTTP requests to HTTPS.
- Request JSON and form payloads are limited to 1 MB.
- Production startup rejects a missing database configuration or the development JWT secret.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Set to `production` for deployment safeguards |
| `PORT` | Service port; defaults to 3000 |
| `HOST` | Bind address; defaults to `0.0.0.0` in the entry point |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection settings |
| `DB_SSL` | Set `true` to enable TLS for PostgreSQL |
| `DB_SSL_REJECT_UNAUTHORIZED` | Set `false` only when the deployment requires it |
| `JWT_SECRET` | Required production signing secret |
| `JWT_TTL_SECONDS` | Session/token lifetime; defaults to 8 hours |

### Local startup

```powershell
npm.cmd install
docker compose up -d postgres
npm.cmd run migrate
npm.cmd start
```

With the current Compose configuration, PostgreSQL is exposed on host port `5433` and container port `5432`. Configure the application accordingly, for example `DB_HOST=localhost` and `DB_PORT=5433`.

## 10. Quality checks

The repository provides the following scripts:

| Command | Purpose |
| --- | --- |
| `npm.cmd start` | Start the application |
| `npm.cmd run dev` | Start Node in watch mode |
| `npm.cmd test` | Run server and browser-auth tests |
| `npm.cmd run verify` | Run tests plus JavaScript syntax checks |
| `npm.cmd run migrate` | Run `server/migrations/init.sql` |

### Audit result

On 6 August 2026, `npm.cmd test` completed with **26 passing tests, 0 failures, and 1 skipped database-availability test**. The test output logs deliberate authentication/authorization error cases while exercising the error handler; these log lines are not test failures.

Coverage includes browser session behavior, health endpoints, static client serving, security headers, authentication, throttling, reference data, route authorization, report controllers, password hashing, session revocation, CRUD/validation, and status derivation.

## 11. Delivery and deployment

`docker-compose.yml` provisions a PostgreSQL 16 Alpine service with persistent storage and initializes a fresh database from `server/migrations/init.sql`.

The GitHub Actions workflow:

1. Runs on pushes to `main` and manual dispatch.
2. Installs dependencies with `npm ci`.
3. Runs the verification script.
4. Packages the application without tests, local report data, or `node_modules`.
5. Deploys the artifact to Azure App Service.
6. Calls `/api/health` after deployment.

Deployment requires `AZURE_WEBAPP_PUBLISH_PROFILE` and an appropriate Azure App Service configuration. `AZURE_WEBAPP_NAME` is currently set to `scout-report` and must match the target App Service.

## 12. Pending work and known gaps

These items are absent, incomplete, or inconsistent with the current implementation.

### Highest priority before a production rollout

1. **Introduce report ownership and data scoping.** Add `owner_id` to reports, set it from the authenticated user instead of accepting user-supplied ownership, and restrict scouts to their own reports. The current API exposes all reports to any signed-in user.
2. **Define the operational workflow.** The current two-role model has no supervisor review, HOD hand-off, report verification, audit trail, or explicit sharing state.
3. **Use a versioned migration system.** `npm.cmd run migrate` only executes the initial schema file. It is suitable for a blank database but is not a safe, tracked upgrade path for a database that already exists.
4. **Correct and consolidate documentation.** `README.md` still contains stale route/deployment language, including a mixture of root and `/api` route assumptions. This document reflects the code; the README should be aligned to it.
5. **Perform deployment smoke tests against PostgreSQL.** The test suite has one database-dependent test skipped locally, so a real database migration and end-to-end production-like test remain necessary.

### Functional gaps

- JSON/CSV import and export are not implemented or tested.
- There is no server-side image/file attachment capability for field evidence.
- Reports do not capture recommendations, corrective actions, assignment, due dates, or resolution confirmation.
- There are no notifications for critical reports or overdue actions.
- The dashboard does not provide documented downloadable reports, charts by trend, maps, or scheduled reporting.
- User management is limited: there is no admin UI to activate/deactivate users, reset passwords, assign roles, or revoke all sessions.

### Technical and security gaps

- The rate limiter is process-local and resets on restart; it does not protect a multi-instance deployment. Use a shared backing store such as Redis.
- Browser tokens are readable by JavaScript because they are stored in `sessionStorage`. Evaluate an HTTP-only secure-cookie session design and add a CSRF strategy if adopting cookies.
- The app sets security headers directly but does not configure a Content Security Policy.
- There is no explicit CORS policy in the current Express configuration, despite `cors` being listed as a dependency.
- Error handling writes expected client errors to the server console, creating noisy logs.
- The database connection config is read directly from `process.env`; `server/config/env.js` is not the runtime source used by the entry point, so configuration ownership is duplicated.
- The static preview hub exposes showcase content without requiring a signed-in user. Decide whether it should remain public in production.

## 13. Recommended roadmap

### Phase 1: Trustworthy access and workflow

- Add report ownership and row-level authorization tests.
- Add roles for inter-farm supervisor and head of department only after the approval states and permissions are agreed.
- Implement an explicit progression such as draft -> submitted -> supervisor verified -> HOD reviewed -> shared with admin, with timestamps and actor IDs.
- Make scout permission to allow supervisor edits an explicit report-level choice.
- Add immutable audit events for report changes, verification, sharing and deletion.

### Phase 2: Operational reporting

- Implement validated JSON import with a batch limit and a clear error report.
- Implement CSV and JSON export using only reports visible to the current user.
- Add attachments for photos, including object storage, virus/content checks, and signed download URLs.
- Add actionable recommendations, assignees, due dates and resolution states.
- Add notification rules for critical findings and overdue actions.

### Phase 3: Decision support and scale

- Add dashboard trend charts, location maps, severity heatmaps and farm/crop comparison.
- Add scheduled weekly/monthly summaries by email or collaboration channel.
- Add a mobile/offline-first field experience with queued synchronization.
- Add database backups, restore drills, observability, alerting, and retention policies.
- Replace in-memory throttling with distributed rate limiting and add a CSP, security testing, and dependency scanning.

## 14. Definition of done for the next release

The next release should not be considered complete until it has:

- A reviewed role/ownership matrix and tests for every access rule.
- A versioned migration that upgrades an existing database safely.
- Browser and API end-to-end tests against PostgreSQL.
- Updated README/API reference generated or maintained from the actual routes.
- Successful CI verification and a deployment health check.
- A short release note stating schema changes, role changes, and any user-facing workflow changes.


## 2026-08-10 Workflow Rebase

Scout Report now implements organizational verification as a separate workflow layer. Roles are `scout`, `inter_farm_supervisor`, `head_of_department`, and `admin`. A report moves Scout → Inter-Farm Supervisor → Head of Department → Administrator, with mandatory verification before each forward share. Every action is recorded in `report_workflow_events`; current assignment is stored in `report_workflows`.

See `docs/workflow/README.md`, `docs/workflow/OPERATIONS.md`, and `docs/workflow/REBASE-2026-08-10.md`.

## 2026-08-12 HOD Authentication Remediation

The `head_of_department` role, browser dashboard and workflow route are present. Administrators assign elevated roles. Admin user management now also supports password reset at `PATCH /api/admin/users/:id/password`, preserving the assigned role and revoking existing sessions. This resolves the operational path for an existing HOD account that reports `Invalid email or password`.
