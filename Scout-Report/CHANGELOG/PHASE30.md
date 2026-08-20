# Scout Report — Phase 30

## Baseline

Baseline inspected: `Scout-Report-PHASE28-GIT.zip`, branch `phase28-overlay`, commit `1558f76` (`fix: resolve pest and disease references on report submission`).

Phase 30 preserves the existing architecture and focuses on report submission reliability, database schema consistency, database-backed form autofill, and regression coverage.

## Baseline inventory

Key components inspected:

- `server/app.js`
- `server/index.js`
- `server/db.js`
- `server/store.js`
- `server/controllers/report.controller.js`
- `server/routes/report.routes.js`
- `server/routes/index.js`
- `server/canonical-observations.js`
- `server/controllers/canonical-observations.controller.js`
- `server/routes/canonical-observations.routes.js`
- `server/migrations/init.sql`
- `server/migrations/002_report_workflow.sql`
- `server/migrations/004_expanded_scouting_model.sql`
- `server/migrations/007_master_reference_data.sql`
- `server/migrations/008_phase23_canonical_provenance.sql`
- `previews/user-form.html`
- existing server and browser tests

## Submission flow

```text
Authenticated browser
  |
  | GET /api/reference/farms
  | GET /api/reference/master-crops
  | GET /api/reference/pests
  | GET /api/reference/diseases
  v
Scout Report form
  |
  | POST /api/reports
  v
report.routes.js
  |
  | authenticate + authorizeRoles
  v
report.controller.createReport()
  |
  v
store.saveReport()
  |
  +--> normalizeReportInput()
  |      +--> resolve farm from PostgreSQL
  |      +--> resolve crop from PostgreSQL
  |      +--> validate variety against PostgreSQL
  |      +--> resolve pest/disease references
  |
  +--> PostgreSQL transaction
  |      +--> INSERT scout_reports
  |      +--> INSERT pest_observations
  |      +--> INSERT disease_observations
  |      +--> INSERT report_workflows / events
  |
  v
findReport()
  |
  v
HTTP 201 report response
  |
  +--> browser canonical extension calls
         +--> cropObservations
         +--> weatherObservations
         +--> soilObservations
         +--> irrigationObservations
         +--> stops (when GPS is present)
```

## Root cause of the known PostgreSQL INSERT failure

The report store INSERT contains **33 target columns and 33 value expressions**. The parameter order is `$1` through `$33` and maps to the normalized report object in the same order.

The problem was not an extra value in the current SQL.

The database bootstrap path was incomplete:

- `server/migrations/init.sql` creates the original `scout_reports` table with the legacy report columns.
- `server/migrations/004_expanded_scouting_model.sql` adds 13 canonical report-header columns.
- `server/migrations/007_master_reference_data.sql` adds `master_observations`.
- `server/migrations/008_phase23_canonical_provenance.sql` adds `canonical_payload`.

That migration chain produces the 33-column schema expected by `server/store.js`.

However, `docker-compose.yml` previously mounted **only `init.sql`** into PostgreSQL's initialization directory. A fresh PostgreSQL volume therefore received the legacy schema but not the later canonical columns. The application then attempted the 33-column INSERT against the smaller table, producing PostgreSQL error `42601: INSERT has more expressions than target columns`.

### Phase 30 fix

Docker PostgreSQL initialization now mounts the complete `server/migrations` directory into `/docker-entrypoint-initdb.d`. PostgreSQL therefore executes the migrations in lexical order during first-volume initialization.

The report SQL itself was deliberately **not reduced** to hide missing schema fields. Canonical fields remain persisted.

## Database contract

The report INSERT contract was regression-tested directly from the source:

- target columns: 33
- value expressions: 33
- placeholders: `$1` through `$33`
- canonical header fields verified against the migration chain

This prevents a future SQL column/value count regression.

## Database-backed Autofill from DB

The form previously loaded reference data from PostgreSQL but did not contain the requested database-backed report autofill control.

Phase 30 adds:

- **Autofill from DB** toolbar action.
- Authenticated request to `GET /api/reports?limit=1`.
- The existing report access clause limits non-admin users to reports owned by the logged-in user.
- The latest saved report is used as the autofill source.
- Farm and crop are matched against the currently loaded PostgreSQL-backed reference data.
- Variety is restored after the crop selection is loaded.
- Header, environmental, location, canonical master-observation values, and notes are restored.
- GPS display is restored when location data exists.
- The form remains editable after autofill.
- Autofill never submits automatically.
- The submit button remains responsible for the authenticated POST operation.

## Canonical observation handling

The existing form already persists pest and disease observations as part of `POST /api/reports`.

Phase 30 retains the existing canonical extension mechanism for the expanded domains and improves failure visibility:

- empty weather observations are no longer created merely because the report was saved;
- canonical extension failures are surfaced to the form instead of being silently logged and reported as a successful canonical save;
- crop, weather, soil, irrigation, and GPS stop records are created only when meaningful data is present.

## API contract

The existing canonical report endpoint remains:

`POST /api/reports`

Authentication and role restrictions remain unchanged.

Reference APIs remain:

- `GET /api/reference/farms`
- `GET /api/reference/master-crops`
- `GET /api/reference/pests`
- `GET /api/reference/diseases`

No unnecessary report endpoint redesign was introduced for autofill; the existing authenticated `GET /api/reports?limit=1` contract is reused.

## Test results

### `npm test`

The original package test command did not include root-level `server/*.test.js` files because the previous glob pattern only expanded the nested path under the shell's normal glob rules.

Phase 30 corrects the test command to include both root and nested test files.

Verified result after the contract/autofill changes:

- **129 tests discovered**
- **127 passed**
- **0 failed**
- **2 skipped**

The two skipped tests are database integration tests gated by environment variables and therefore are not falsely reported as passed.

The two skips are expected because PostgreSQL is not available in this execution environment.

## PostgreSQL runtime status

A direct PostgreSQL connection test was attempted.

Result:

`ECONNREFUSED 127.0.0.1:5432`

Docker is also unavailable in this execution environment, so a PostgreSQL container could not be started here.

Therefore:

- PostgreSQL source/schema contract: **PASS**
- SQL column/value contract: **PASS**
- Mocked report persistence tests: **PASS**
- Application server startup: **PASS — degraded mode**
- Port fallback: **PASS — preferred port was busy and server selected another port**
- Live PostgreSQL persistence: **BLOCKED — no PostgreSQL runtime available**
- Live browser login/form/DB submission: **BLOCKED — requires live PostgreSQL and a browser session**

## Development server

`node server/index.js` was exercised directly using the Phase 30 source.

The server:

1. attempted PostgreSQL connection;
2. detected that PostgreSQL was unavailable;
3. entered its existing degraded mode;
4. selected another available HTTP port when the preferred port was busy;
5. started successfully;
6. shut down cleanly when the execution timeout terminated the process.

This confirms the port fallback behavior was not regressed.

## Browser smoke test status

The full live sequence was **not claimable as PASS** because this environment has no PostgreSQL service and no interactive browser session:

```text
LOGIN                  BLOCKED
OPEN FORM              SOURCE VERIFIED
AUTOFILL FROM DB       SOURCE VERIFIED / LIVE BLOCKED
EDIT VALUES            SOURCE VERIFIED
SUBMIT                 SOURCE VERIFIED / LIVE BLOCKED
POST /api/reports     ROUTE + MOCK TEST VERIFIED
DATABASE CHECK         BLOCKED
CANONICAL DB CHECK     BLOCKED
RELOAD REPORT          BLOCKED
```

No fabricated browser or PostgreSQL result is reported.

## Files changed in Phase 30

- `docker-compose.yml`
  - PostgreSQL now initializes from the complete migration directory.
- `package.json`
  - test command now includes root-level and nested test files.
- `previews/user-form.html`
  - added database-backed Autofill from DB;
  - restores saved report values;
  - preserves editability;
  - avoids empty weather canonical records;
  - surfaces canonical extension failures.
- `previews/master-reference.test.js`
  - added Autofill regression coverage.
- `server/report-persistence.contract.test.js`
  - added report INSERT/schema contract regression tests.

## Existing functionality preserved

No application-wide UI redesign was performed.

The following existing architecture remains intact:

- PostgreSQL-backed store
- JWT/session authentication
- role-based authorization
- existing `/api/reports` endpoint
- existing reference APIs
- existing canonical observation routes
- existing workflow creation
- master spreadsheet form and 38-column mapping
- existing port fallback behavior

## Remaining limitation

Phase 30 cannot honestly certify the final live database transaction in this environment. The code-level root cause and migration/bootstrap mismatch are fixed, but a real PostgreSQL instance must be started on the developer machine before the final end-to-end acceptance test can be marked PASS.

For a fresh local database, use the existing migration command or recreate the PostgreSQL volume so the complete migration directory is applied.

## Next development step

**NEXT DEVELOPMENT STEP: PHASE 31**

Priority for Phase 31:

1. Run the complete live PostgreSQL integration suite against a clean database.
2. Execute authenticated browser smoke testing with real reference data.
3. Verify report persistence and canonical rows directly with SQL queries.
4. Verify rollback behavior when any canonical extension fails.
5. Verify workflow ownership and subsequent verification transitions.
6. Only after data-integrity acceptance, expand admin workflow testing.

UI redesign is intentionally not the next priority.
