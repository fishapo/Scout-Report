# Scout Report Phase 30 — Test Report

## Automated test command

```text
npm test
```

## Result

```text
129 tests
127 passed
0 failed
2 skipped
```

## New regression coverage

### Report persistence contract

`server/report-persistence.contract.test.js`

Checks:

- exactly 33 `scout_reports` INSERT target columns;
- exactly 33 value expressions;
- placeholders are sequential `$1` through `$33`;
- canonical report columns are represented by the migration chain;
- Docker initialization references the complete migrations directory.

### Form Autofill

`previews/master-reference.test.js`

Checks:

- Autofill button exists;
- authenticated report API is used;
- latest report query uses `limit=1`;
- master observations are restored;
- values remain editable.

## Live PostgreSQL

Attempted and blocked by environment:

```text
ECONNREFUSED 127.0.0.1:5432
```

Docker was not available in the execution environment.

## Server startup

Pass:

- application starts in degraded mode when PostgreSQL is unavailable;
- preferred-port conflict is handled by selecting another port;
- process shuts down cleanly.

## Acceptance matrix

| Acceptance item | Result |
|---|---|
| Logged-in form route exists | PASS — source/tests |
| Reference APIs are database-backed | PASS — source/tests |
| Autofill from DB | PASS — implementation/static regression; live DB blocked |
| Autofill remains editable | PASS |
| Authenticated POST /api/reports | PASS — route/controller/store tests |
| SQL column/value contract | PASS |
| Schema migration contract | PASS |
| PostgreSQL persistence | BLOCKED — runtime unavailable |
| Canonical DB persistence | BLOCKED — runtime unavailable |
| API live response | BLOCKED — DB runtime unavailable |
| Existing automated tests | PASS |
| Browser live smoke test | BLOCKED — no interactive browser/DB |
