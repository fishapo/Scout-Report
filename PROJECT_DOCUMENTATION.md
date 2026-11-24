# Scout Report Master Documentation

**Release:** 2.3.1  
**Repository:** `fishapo/Scout-Report`  
**Verified revision:** `5c62d95`  
**Documentation date:** 24 November 2026  
**Status:** Authoritative operational and technical reference

> This master document reconciles the implemented application, database migrations, tests, deployment configuration, and operational records. Phase reports under `docs/` remain historical evidence; where they conflict with this document or the current source code, the current code and this master take precedence.

## 1. Executive summary

Scout Report is a Node.js and PostgreSQL application for recording agricultural scouting visits, capturing pest and disease observations, routing reports through organizational verification, and publishing approved data to administrator analytics. It supports online and offline field capture, Excel workbook integration, role-based dashboards, reference-data administration, immutable workflow events, and database-backed release verification.

The production workflow is:

1. A scout records and submits a report.
2. The scout shares it with an assigned Inter-Farm Supervisor.
3. The supervisor verifies or rejects it.
4. An approved supervisor report is shared with the Head of Department.
5. The HOD verifies or rejects it, then shares an approved report with an administrator.
6. The administrator performs final verification and makes the report available to global analytics.

The application preserves scout ownership. A supervisor can edit a report only when assigned to it and explicitly allowed by the scout. HOD review is read-only. Workflow state and agricultural severity are stored separately.

### 1.1 Management brief

Scout Report replaces disconnected field forms and spreadsheet hand-offs with one controlled reporting chain. Management receives traceable evidence of who created, reviewed, returned, approved, and released every report. It also preserves the value of the existing Excel workbook by importing its structure and reference data into a governed web workflow.

| Management objective | System response | Management value |
|---|---|---|
| Timely field visibility | Online and offline capture with queued synchronization | Work continues during network interruption and becomes visible after reconnection |
| Clear accountability | Role inboxes, checklists, comments, and immutable workflow events | Every hand-off has an owner, status, and audit trail |
| Data quality | Workbook-aligned form, reference data, validation, and staged import | Reduces re-entry and inconsistent classifications |
| Controlled publication | Supervisor, HOD, and Admin verification before analytics | Unapproved reports cannot enter management analytics |
| Ownership protection | Scout-controlled supervisor editing and read-only HOD review | Original field accountability is retained |
| Operational resilience | PostgreSQL, migrations, automated tests, health checks, and backup requirements | Supports repeatable releases and recovery |

**Current position.** Release 2.3.1 is a tested operational baseline. Workflow, offline queueing, workbook import, security controls, and administrator analytics are implemented. Production operation still requires approved hosting, TLS, managed secrets, monitoring, encrypted backups, and a named service owner.

**Accountability.** Management owns verification policy and service targets. Department managers maintain reviewer assignments. The administrator controls users, reference data, final release, and analytics. IT owns hosting, backups, monitoring, patching, and incident response. Users remain accountable for the accuracy and timeliness of their actions.

### 1.2 Management controls and performance indicators

| Indicator | Recommended measure | Evidence source |
|---|---|---|
| Submission timeliness | Visits submitted within the agreed reporting window | Report and visit timestamps |
| Review turnaround | Median and overdue time at Supervisor, HOD, and Admin stages | Workflow event timestamps |
| First-pass approval | Percentage approved without rejection at each stage | Approval and rejection events |
| Correction load | Returns, repeat returns, and dominant reasons | Workflow comments and event history |
| Offline synchronization | Successful queued submissions and unresolved failures | Offline queue and API results |
| Analytics readiness | Approved reports released by farm, period, crop, and department | Administrator analytics dataset |
| Platform reliability | Availability, failed requests, restore tests, and security events | Health, metrics, logs, and backups |

Targets should be set by operations after a baseline period and reviewed weekly or monthly; the software should not invent business targets.

### 1.3 Approval workflow

```text
Scout: /scout-form
  Draft or offline queue
          |
          | submit and share
          v
Supervisor: /inter-farm-supervisor-dashboard
  Verify or reject; share approved report
          |
          v
HOD: /head-of-department-dashboard
  Read-only verify or reject; share approved report
          |
          v
Administrator: /admin-verification-dashboard
  Final verify or return
          |
          v
Management analytics: /admin-dashboard.html

Reject -> return to the accountable prior stage -> correct -> resubmit
```

The administrator is the release authority. Supervisor and HOD approval do not publish a report to global analytics. Rejection returns work to the accountable earlier stage while preserving the audit history.

### 1.4 Page and navigation workflow

All authenticated users enter through `/dashboard`. The server reads the authenticated role and redirects to the protected dashboard for that role.

| Page | Route | Role | Purpose and next action |
|---|---|---|---|
| Sign in / registration | `/login` | All users | Authenticate, then continue to the role router |
| Role router | `/dashboard` | Authenticated users | Redirect to the dashboard assigned to the account |
| Scout dashboard | `/scout-dashboard` | Scout | View owned reports, create or open a report, share, and correct returns |
| Report form | `/scout-form` | Workflow roles, subject to policy | Create or inspect workbook-aligned data and return to the appropriate dashboard |
| Supervisor dashboard | `/inter-farm-supervisor-dashboard` | Supervisor | Review, checklist, reject or approve, then share approved work with HOD |
| HOD dashboard | `/head-of-department-dashboard` | HOD | Read-only review, reject or approve, then share accepted work with Admin |
| Admin verification | `/admin-verification-dashboard` | Admin | Final-review, return, or approve for analytics |
| Admin analytics | `/admin-dashboard.html` | Admin | View global approved-report analytics |
| User administration | `/admin-users` | Admin | Manage accounts and access |
| Reference administration | Admin controls | Admin | Maintain farms, crops, scouts, pests, diseases, and mappings |

Shared form access does not mean shared editing authority. Server policy determines whether a user may create, edit, or only view a selected report. Reversible form/dashboard navigation does not weaken authorization.

### 1.5 Management decision matrix

| Decision or control | Accountable owner | Required evidence |
|---|---|---|
| Reporting and verification policy | Management / process owner | Approved workflow, roles, and service targets |
| Farm, scout, and reviewer assignments | Department management | Current assignments and access review |
| Release a report to analytics | Administrator | Completed verification chain and final approval |
| Reference data or workbook mapping change | Admin with business approval | Change record, preview, validation, and rollback plan |
| Release or migration deployment | IT / system owner | Passing CI, backup, migration record, smoke test, revision |
| Service or data restoration | IT / system owner | Incident record, approved restore point, validation |
| Residual production risk acceptance | Management | Documented exception, owner, mitigation, and review date |

## 2. Current release baseline

| Item | Current baseline |
|---|---|
| Application version | 2.3.1 |
| Runtime | Node.js 22 in CI; Node.js 18 or later supported |
| Web framework | Express 4 |
| Database | PostgreSQL 16 |
| Package manager | npm 10 |
| Browser authentication | HttpOnly cookie session |
| Roles | Scout, Inter-Farm Supervisor, Head of Department, Admin |
| Offline cache | Service worker cache `scout-report-offline-v4` |
| Offline queue | IndexedDB, scoped to the authenticated user |
| Database upgrade set | `init.sql` plus migrations 002 through 011 |
| CI gate | Audit, migrations, serial unit/contract/integration tests |
| Verified test result | 142 of 142 tests passed with live PostgreSQL |
| Dependency audit | 0 known npm vulnerabilities at release verification |
| Static deployment | GitHub Pages environment healthy |
| Backend deployment | Requires Node.js and PostgreSQL; GitHub Pages alone cannot host the API |

## 3. Product scope

### 3.1 Field reporting

- Create a scouting report for a valid farm, date, implementation week and crop context.
- Record production area as Field, Greenhouse, or Shade Net while preserving legacy greenhouse compatibility.
- Capture pest, disease, crop, weather, soil, irrigation, GPS, notes, and visit timing data.
- Save a report offline after the user has signed in online at least once.
- Automatically synchronize queued reports and canonical extensions when connectivity returns.
- Capture private JPEG, PNG, WebP, MP4, or WebM evidence with previews, captions, capture location, checksums, and a 10 MB per-file limit.
- Print or export reports for operational use.

### 3.2 Verification and governance

- Assign every hand-off to a real user in the next authorized role.
- Require a stage-specific verification checklist.
- Approve or reject at supervisor, HOD, and administrator stages.
- Record immutable workflow events with actor, role, action, source stage, destination stage, recipient, comment, and timestamp.
- Keep report severity (`Pending`, `Completed`, or `Critical`) independent from verification state.

### 3.3 Administration and analytics

- Administer users, passwords, and roles.
- Maintain farms, crop types, varieties, pests, and diseases.
- Stage and commit master workbooks with provenance.
- View global analytics only as an administrator.
- Keep non-admin dashboards focused on assigned workflow work rather than unrestricted analytics.

## 4. Roles and permissions

| Capability | Scout | Inter-Farm Supervisor | Head of Department | Admin |
|---|---:|---:|---:|---:|
| Create own field report | Yes | No | No | Administrative access only |
| Work offline | Yes | No | No | No |
| Share to next stage | To supervisor | To HOD after approval | To admin after approval | No |
| Verify assigned stage | No | Supervisor stage | HOD stage | Final stage |
| Reject to prior stage | No | To scout | To supervisor | To HOD |
| Edit report content | Owner | Only with scout consent and assignment | No | Governed administration only |
| View workflow inbox | Own/returned work | Assigned work | Assigned work | Awaiting final review |
| View global analytics | No | No | No | Yes |
| Manage users and roles | No | No | No | Yes |
| Manage reference data | No | No | No | Yes |
| Stage master workbook | No | No | Yes | Yes |

Authorization is enforced by the server. Hiding controls in the browser is not a security boundary.

## 5. Report lifecycle

### 5.1 Normal path

| Stage | Holder | Permitted action | Successful destination |
|---|---|---|---|
| Draft or scout correction | Scout | Edit and share | Awaiting supervisor |
| Awaiting supervisor | Assigned supervisor | Review and verify | Supervisor verified |
| Supervisor verified | Supervisor | Share | Awaiting HOD |
| Awaiting HOD | Assigned HOD | Read and verify | HOD verified |
| HOD verified | HOD | Share | Awaiting admin |
| Awaiting admin | Assigned admin | Final verify | Approved |

### 5.2 Rejection path

Rejection returns the report to the immediately previous operational stage. The reviewer must supply the applicable decision and comments. A rejected report is not silently moved forward, and every return is recorded as a workflow event.

### 5.3 Ownership and editing rules

1. The scout remains the report owner.
2. Supervisor access requires assignment to the report.
3. Supervisor editing additionally requires `supervisor_edit_allowed` to be enabled by the scout.
4. HOD verification is read-only.
5. The current holder cannot bypass content authorization merely because the workflow is assigned to them.
6. Canonical observations and visit details use the same edit policy as the main report.

## 6. Browser application

| Route | Purpose | Access |
|---|---|---|
| `/login` | Sign in and registration | Public |
| `/dashboard` | Role-aware dashboard routing | Authenticated |
| `/scout-dashboard` | Owned and returned report work | Scout only |
| `/scout-form` | Field report capture or authorized inspection | Workflow roles, subject to report policy |
| `/inter-farm-supervisor-dashboard` | Assigned supervisor review inbox | Supervisor only |
| `/head-of-department-dashboard` | Assigned departmental review inbox | HOD only |
| `/admin-verification-dashboard` | Final verification inbox | Admin only |
| `/admin-dashboard.html` | Global analytics and administration | Admin only |
| `/admin-users` | User and access administration | Admin only |
| `/health` | Application health response | Public operational probe |

The browser does not store bearer tokens in local or session storage. Login establishes an HttpOnly cookie, logout clears it, and legacy browser tokens are removed when the authentication client loads.

## 7. API overview

### 7.1 Authentication and session

- Register and login establish the browser cookie session.
- Logout clears the active session.
- The authenticated-user endpoint provides role-aware routing context.
- Explicit bearer authentication remains supported for approved API clients.

### 7.2 Reports and observations

- Report routes create, list, retrieve, update, import, export, print, and delete reports subject to role and ownership policy.
- Canonical observation routes read a complete report model or work with a specific domain.
- Visit details and canonical child records use stable identifiers and transaction-safe writes.
- `clientSubmissionId` provides per-owner idempotency for offline replay.

### 7.3 Workflow

- `GET /api/workflow/inbox` returns work assigned to the signed-in role.
- `GET /api/workflow/:id` returns workflow state and history.
- `POST /api/workflow/:id/share` hands a report to a valid next-stage recipient.
- `POST /api/workflow/:id/verify` records an approval or rejection.
- Checklist routes retrieve and update the stage verification checklist.

### 7.4 Reference data and administration

- Protected reference routes supply farms, crops, varieties, pests, diseases, master crops, and stress references.
- Admin reference routes provide create, read, update, and delete operations for governed reference records.
- Admin user routes create users, set passwords, change roles, list users, and delete eligible users.
- Admin dashboard and metrics endpoints are inaccessible to non-admin roles.

### 7.5 Master workbook import

- Stage a binary workbook with `POST /api/master-import/stage`.
- Inspect staged batches and validation results before committing.
- Commit an accepted batch with `POST /api/master-import/:id/commit`.
- Export the original staged source for provenance.
- A scout can request the assigned workbook prefill through the protected prefill endpoint.

## 8. Workbook and form integration

The application maps the supplied master scouting workbook into a canonical report structure rather than treating the workbook as an opaque attachment. The current mapping includes 38 source columns and a 93-field canonical model across the report and child domains.

### 8.1 Import principles

1. Parse workbooks with bounded input size and bounded expanded content.
2. Validate headers, types, farm references, dates, and required values before commit.
3. Stage first, then commit; do not partially import an invalid workbook.
4. Preserve original-source metadata and import provenance.
5. Ignore file-supplied ownership and workflow audit fields; the authenticated user and workflow rules control them.
6. Start newly imported reports within the normal verification process.

### 8.2 Form alignment

The form submits canonical farm identifiers and names, report date, crop and production-area context, observations, notes, and visit metadata. Workbook-prefill data populates the assigned scout form without weakening validation. Stable observation identifiers prevent duplicate child records during offline replay.

### 8.3 Export

Excel and structured exports are intended for operational exchange and backup. Exported values reflect the viewer's authorized report set. An export does not grant permission to alter ownership or workflow state on re-import.

## 9. Offline capability

### 9.1 Capture

After one successful online sign-in, a scout can open the cached form, enter a report, select evidence, and submit while disconnected. The application stores the report, its canonical extensions, and selected media blobs in IndexedDB with:

- an offline identifier;
- the owner user ID;
- a client submission ID;
- the main report payload;
- canonical extension payloads; and
- stable media IDs and private evidence blobs for replay-safe upload.

### 9.2 Synchronization

When the browser returns online, queued records for the current user are synchronized automatically. The main report is created first, canonical extensions are written second, and evidence files are uploaded last. The queue item is removed only after the full operation succeeds.

### 9.3 Safety boundaries

- A queue belonging to another or legacy account is blocked rather than submitted under the wrong user.
- Server idempotency prevents duplicate reports when a request is retried.
- Stable child observation identifiers make extension writes replay-safe.
- Offline mode is data capture, not a substitute for authentication or authorization.
- Users should keep the browser profile and device secure because queued field data is stored locally until synchronized.

## 10. Data architecture

### 10.1 Core entities

| Domain | Main responsibility |
|---|---|
| Users | Identity, password hash, active role |
| Scout reports | Owner, farm, dates, crop context, status, notes, workflow-compatible metadata |
| Report workflow | Current stage and current holder |
| Workflow events | Immutable transition audit trail |
| Verification checklists | Stage-specific review evidence |
| Canonical observations | Pest, disease, crop, weather, soil, irrigation, GPS, and related details |
| Reference data | Farms, crops, varieties, pests, diseases, stress references |
| Master import batches | Staged workbook, validation, provenance, and commit status |

### 10.2 Migration sequence

| Migration | Purpose |
|---|---|
| `init.sql` | Base users, references, reports, and foundational schema |
| `002_report_workflow.sql` | Multi-stage workflow and event model |
| `003_analytics_indexes.sql` | Analytics and query indexes |
| `004_expanded_scouting_model.sql` | Expanded canonical scouting domains |
| `005_phase22_verification_checklists.sql` | Stage checklist persistence |
| `006_phase22_master_import_staging.sql` | Staged workbook import |
| `007_master_reference_data.sql` | Canonical workbook reference data |
| `008_phase23_canonical_provenance.sql` | Provenance for mapped data |
| `009_scout_workbook_prefills.sql` | Scout assignment and prefill storage |
| `010_supervisor_edit_permission.sql` | Explicit scout-controlled supervisor edit permission |
| `011_offline_submission_idempotency.sql` | Per-owner offline submission idempotency |

The migration runner loads environment configuration, applies the base schema safely, and then applies numbered upgrades in order. Migrations must be run before starting a new release against an existing database.

## 11. Security model

### 11.1 Implemented controls

- Passwords are hashed; plaintext passwords are not stored.
- Browser sessions use HttpOnly cookies and production cookies use the secure flag.
- Browser write requests require a matching origin; bearer API clients remain supported.
- Role, ownership, assignment, workflow state, and explicit edit consent are checked server-side.
- Global analytics and administrative APIs require the admin role.
- Proxy headers are ignored unless `TRUST_PROXY_HOPS` is explicitly configured.
- Authentication throttling keys include normalized account identity.
- Express signature disclosure is disabled.
- Content Security Policy, frame protection, content-type protection, and Permissions Policy headers are applied.
- PostgreSQL Docker exposure is restricted to `127.0.0.1:5433` for local operation.
- Workbook parsing is bounded to reduce decompression and memory-exhaustion risk.
- Media content is signature-validated, size-limited, stored outside the public web root, and served only after report authorization.
- Audit events preserve workflow accountability.

### 11.2 Production requirements

- Use a unique, high-entropy `JWT_SECRET`; the development fallback is not acceptable in production.
- Store database and session secrets outside source control.
- Terminate TLS before the application and configure `TRUST_PROXY_HOPS` to the exact proxy count.
- Restrict database network access to application hosts and operators.
- Back up PostgreSQL and test restores on a schedule.
- Review user access and privileged audit events regularly.

## 12. Configuration

| Variable | Purpose | Typical value |
|---|---|---|
| `NODE_ENV` | Runtime security mode | `production` |
| `HOST` | Application bind address | `0.0.0.0` or `127.0.0.1` |
| `PORT` | HTTP port | `3000` |
| `JWT_SECRET` | Session signing secret | Secret, at least 32 characters |
| `JWT_TTL_SECONDS` | Session duration | `28800` |
| `TRUST_PROXY_HOPS` | Exact trusted reverse-proxy hops | `0` locally |
| `MEDIA_STORAGE_DIR` | Private report-evidence storage directory | `var/report-media` |
| `DB_HOST` | PostgreSQL host | `127.0.0.1` |
| `DB_PORT` | PostgreSQL port | `5433` locally with Docker |
| `DB_NAME` | Database name | `scout_report` |
| `DB_USER` | Database user | `scout_user` |
| `DB_PASSWORD` | Database password | Secret |
| `DB_SSL` | Enable PostgreSQL TLS | `true` when required |
| `DB_SSL_REJECT_UNAUTHORIZED` | Verify database certificate | `true` preferred |
| `RUN_DB_TESTS` | Enable database tests | `1` in full verification |
| `RUN_DB_INTEGRATION` | Enable runtime integration tests | `1` in CI |

## 13. Local installation and operation

1. Install Node.js 22, npm, Docker Desktop, and Git.
2. Copy the environment example to `.env` and set secrets.
3. Install dependencies with `npm.cmd ci` on Windows PowerShell.
4. Start PostgreSQL with `docker compose up -d postgres`.
5. Confirm the container is healthy and port 5433 is bound only to localhost.
6. Apply schema upgrades with `npm.cmd run migrate`.
7. Start the application with `npm.cmd start`.
8. Open `http://localhost:3000` and sign in.
9. Confirm `/health`, role routing, workflow inboxes, report submission, and analytics authorization.

Do not expose the local Docker database port on all network interfaces. Do not commit `.env` or copied production data.

## 14. Testing and release gates

### 14.1 Required checks

```text
npm.cmd ci
npm.cmd audit --omit=dev --audit-level=moderate
npm.cmd run migrate
npm.cmd run test:ci
```

The CI workflow runs PostgreSQL 16 as a service, installs from the lockfile, audits production dependencies, applies migrations, and runs tests serially to avoid database race conditions.

### 14.2 Current verified result

| Gate | Result |
|---|---|
| GitHub workflow checks | 4 of 4 passed |
| Live PostgreSQL suite | 142 of 142 passed |
| Standard verification | 140 passed, 2 intentional database skips when DB flags are absent |
| npm audit | 0 known vulnerabilities |
| Local database | Healthy on `127.0.0.1:5433` |

### 14.3 Acceptance coverage

- authentication, logout, cookie behavior, origin protection, and role routing;
- scout ownership and supervisor edit-consent matrix;
- HOD read-only verification and admin-only analytics;
- workflow transitions, rejection paths, checklists, and audit events;
- workbook mapping, staging, prefill, canonical provenance, and bounded parsing;
- offline caching, user-scoped queues, idempotent report creation, and replay-safe extensions;
- media signature validation, private storage, authorized retrieval, and offline replay protection;
- database migrations, persistence, reference data, and analytics queries.

## 15. Deployment and operations

### 15.1 Deployment model

The full application requires a continuously running Node.js service and PostgreSQL. GitHub Pages can publish static project material or a preview, but it cannot execute Express routes or connect to PostgreSQL. A production deployment must provide:

- Node.js application hosting;
- a managed or securely operated PostgreSQL database;
- TLS and a correctly configured reverse proxy;
- protected environment secrets;
- persistent logs and monitoring; and
- backup and restore procedures.

### 15.2 Release procedure

1. Review the change set and confirm the branch is current.
2. Back up the target database.
3. Run the audit and full verification gates.
4. Deploy application code and dependencies.
5. Apply database migrations once.
6. Restart the service and verify health.
7. Exercise one role-specific login for each role.
8. Submit a test report through the complete verification chain.
9. Confirm only the administrator can see the approved report in global analytics.
10. Record the release revision and operational evidence.

### 15.3 Rollback

Prefer rolling back the application to the previous known-good revision while preserving forward-compatible schema. Restore a database backup only when a data migration cannot safely remain in place and the recovery decision has been approved. Always retain workflow audit evidence.

## 16. Operator and user procedures

### 16.1 Scout

1. Sign in online before first offline use.
2. Open the report form and confirm the assigned workbook prefill when present.
3. Complete farm, report date, crop, production area, observations, and notes.
4. Submit online or save to the offline queue.
5. When online, wait for synchronization success before clearing browser data.
6. Share the report with the correct supervisor.
7. Address any returned correction and resubmit.

### 16.2 Inter-Farm Supervisor

1. Open the assigned workflow inbox.
2. Review the report and checklist.
3. Edit only when the scout explicitly allowed editing.
4. Approve or reject with a useful comment.
5. Share approved work with an HOD.

### 16.3 Head of Department

1. Review the supervisor-approved report without modifying scout content.
2. Complete the HOD checklist.
3. Reject to the supervisor when correction is required.
4. Approve and share accepted work with an administrator.

### 16.4 Administrator

1. Final-review reports awaiting admin action.
2. Approve or return the report to the HOD.
3. Use global analytics only for approved, authorized data.
4. Administer users and reference data with least privilege.
5. Monitor metrics, audit events, backups, and release evidence.

## 17. Known limitations and recommended development

### 17.1 Operational hardening

- Replace in-process authentication throttling with a shared persistent limiter for multi-instance deployments.
- Add centralized structured logs, alerting, dashboards, and retained security-event search.
- Automate encrypted backups and recurring restore drills.
- Introduce workflow notifications, reminders, escalation rules, and overdue-stage reporting.
- Tighten Content Security Policy further by removing remaining inline-script allowances.

### 17.2 Product development

- Expand the visible form UI to cover every canonical domain with the same depth as the database model.
- Move private local media storage to governed object storage for multi-instance hosting, with malware scanning, quotas, retention, and lifecycle deletion.
- Provide an offline queue management screen with retry details and safe discard controls.
- Add analytics drill-down by farm, crop, pest, disease, time period, and workflow turnaround.
- Add configurable workbook mapping profiles with preview and change approval.
- Add signed, immutable report snapshots for regulatory or audit use.

### 17.3 Engineering quality

- Add automated browser end-to-end tests for offline-to-online synchronization and the full four-role workflow.
- Add performance baselines for large workbooks, analytics, and concurrent synchronization.
- Add migration rollback documentation and compatibility checks for every future schema change.
- Generate an API specification from the implemented routes and validate it in CI.

## 18. Documentation governance

This file is the editable master source. `docs/Scout-Report-Management-Master-Documentation.docx` is the compiled management distribution copy. Update both in the same change by running:

```text
uv run --with python-docx python scripts/build_project_documentation.py
```

When behavior changes:

1. Update the relevant tests and implementation.
2. Update this master source, not only a phase note.
3. Rebuild and visually inspect the Word document.
4. Record the verified revision and test result.
5. Keep historical phase reports for evidence, but label new records with date and scope.

## 19. Source map

| Area | Primary source |
|---|---|
| Application composition and page guards | `server/app.js` |
| Authentication and authorization | `server/auth.js`, `server/controllers/auth.controller.js` |
| Report persistence and policy | `server/store.js`, `server/routes/report.routes.js` |
| Workflow | `server/workflow.store.js`, `server/routes/workflow.routes.js` |
| Canonical observations | `server/routes/canonical-observations.routes.js` |
| Workbook import | `server/routes/master-import.routes.js`, `server/master-import.store.js` |
| Offline client | `previews/offline.js`, `previews/offline-extensions.js`, `previews/service-worker.js` |
| Media upload and private storage | `server/report-media.js`, `server/controllers/report-media.controller.js` |
| Database schema | `server/migrations/` |
| CI release gate | `.github/workflows/ci.yml` |
| Local PostgreSQL | `docker-compose.yml` |
| Detailed historical evidence | `docs/` |

## 20. Release statement

Release 2.3.1 is a verified workflow, workbook, analytics, security, and offline-capable baseline. The repository passes the live PostgreSQL test suite and dependency audit at revision `5c62d95`. Production readiness still depends on the target operator supplying secure hosting, TLS, secrets, monitoring, backups, and access governance described in this master document.
