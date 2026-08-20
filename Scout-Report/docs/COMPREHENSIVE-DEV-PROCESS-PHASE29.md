# Scout Report — Comprehensive Development Process From the Clean Baseline
**Baseline:** Phase 29A, 2026-08-18

## Operating rule

Do not jump directly into feature coding. Every phase follows:

**Inspect → Baseline → Reproduce → Fix → Test → Verify → Review → Commit → Push → Record**

Never guess a file's current contents. Read the current file first.

## Phase 29A — Clean and reconcile

### A. Start from the clean package

```bash
cd /path/to/Scout-Report
npm ci
```

Copy `.env.example` to `.env` and fill local values:

```bash
cp .env.example .env
```

On Windows Git Bash:

```bash
cp .env.example .env
```

### B. Baseline commands

```bash
node --version
npm --version
git status
git branch --show-current
git remote -v
npm ci
npm test
```

### C. Syntax audit

Run every JavaScript/module file through Node syntax checking. The supplied `scripts/audit-project.js` performs this inventory.

```bash
node scripts/audit-project.js
```

### D. Repair the eight current failures

First run the focused failing files individually.

```bash
node --test server/store.farm.test.js
node --test server/store.crud.test.js
```

Use the exact test names from the failing output.

For CRUD tests, update the mock database layer to recognize the current `findReport()` SELECT and farm-reference COUNT query. Do not alter production SQL solely to satisfy an obsolete mock.

Then:

```bash
npm test
```

Target:

**129/129 tests passing, 0 failing, with any skipped test explicitly documented.**

### E. Docker migration gate

Inspect the Docker verifier failure:

```bash
npm run verify:phase20
npm run verify:phase21
npm run verify:phase22
npm run verify:phase23
npm run verify:phase26
```

Then:

```bash
docker compose config
docker compose up -d postgres
npm run migrate
```

Verify that every migration in `server/migrations/` runs exactly once and in lexical order.

Do not rename migrations casually. Migration history is part of the database contract.

## Phase 29B — Authentication reconciliation

The uploaded baseline currently uses `server/auth.js`.

Before changing it:

```bash
grep -R "require.*auth" server --exclude-dir=node_modules
grep -R "authenticate\|authorizeRoles" server --exclude-dir=node_modules
```

Inspect:

- `server/auth.js`
- `server/auth.test.js`
- `server/auth-regression.test.js`
- `server/controllers/auth.controller.js`
- `server/routes/auth.routes.js`
- page-auth middleware
- session/JWT database tables
- browser `previews/auth.js`

Acceptance requirements:

- register;
- login;
- `/auth/me`;
- logout/revocation;
- invalid token rejection;
- expired session rejection;
- role enforcement;
- first-user/admin behavior;
- rate limiting;
- browser session restoration;
- no secret leakage.

Only after this contract is stable should a modular auth refactor be considered.

## Phase 29C — API contract audit

Inventory every route:

```bash
grep -R "router\." server/routes server/controllers --exclude-dir=node_modules
```

For each route record:

- method;
- path;
- authentication;
- role;
- request schema;
- response schema;
- database operation;
- error behavior;
- test.

Keep legacy compatibility routes only when a test or documented client requires them.

## Phase 29D — Database audit

Inventory:

```bash
find server/migrations -type f -name "*.sql" -print
```

Check:

- table dependencies;
- foreign keys;
- indexes;
- unique constraints;
- check constraints;
- seed/reference data;
- migration idempotence;
- rollback/recovery procedure.

Never change an existing migration that may already have been applied in real environments. Add a new migration.

## Phase 29E — Reference-data contract

Reference sources are critical because the Phase 24–28 work depends on live IDs.

Verify:

- farms;
- crop types;
- varieties;
- pests;
- diseases;
- spreadsheet aliases;
- greenhouse/location rules.

Run focused tests:

```bash
node --test previews/master-reference.test.js
```

Then verify the live database after migration.

## Phase 29F — Form and browser contract

Test:

1. login;
2. role redirect;
3. farm selection;
4. crop selection;
5. dependent variety selection;
6. greenhouse mode;
7. pest observation;
8. disease observation;
9. reference ID resolution;
10. report submission;
11. workflow routing;
12. logout.

Use browser DevTools Network to confirm payloads contain authoritative IDs rather than display-only labels.

## Phase 29G — Workflow integrity

The required chain remains:

**Scout → Inter-Farm Supervisor → Head of Department → Administrator → Approved**

Test:

- valid share;
- invalid share;
- verification;
- rejection;
- correction;
- reassignment;
- audit event creation;
- role boundaries;
- no stage skipping.

## Phase 29H — Import/export

Test the 38-column master source and canonical 93-field representation.

Acceptance:

- exact source headings;
- deterministic mapping;
- reference resolution;
- validation errors by row;
- duplicate handling;
- provenance preservation;
- XLSX round-trip;
- export/import symmetry.

## Phase 29I — Analytics/dashboard

Validate:

- KPI totals;
- farm/crop aggregation;
- monthly trends;
- workflow distribution;
- recent reports;
- refresh behavior;
- role visibility;
- print/export behavior.

Do not trust UI numbers without testing the API query behind them.

## Phase 29J — Security

Before release:

```bash
git grep -n "JWT_SECRET"
git grep -n "DB_PASSWORD"
git status --ignored
```

Confirm no real credentials are tracked.

Also test:

- authorization bypass;
- SQL injection boundaries;
- invalid IDs;
- oversized payloads;
- rate limits;
- security headers;
- production HTTPS behavior;
- cookie/session behavior;
- error responses that do not expose secrets.

## Phase 29K — Release gate

Run:

```bash
npm ci
npm test
npm run verify
npm run verify:phase23
npm run verify:phase26
node --test previews/master-reference.test.js
```

Then start the server and verify:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/health
```

If port 3000 is busy, use the application's automatic-port behavior rather than changing application logic just to satisfy a local conflict.

## Phase 30+ — Feature development

Only after 29A–29K are green should the next data-rebase feature be selected.

Recommended order:

1. canonical visit/field/stop entities;
2. structured crop/stand/soil/water observations;
3. structured weeds/pests/diseases;
4. management/recommendations;
5. evidence/media;
6. sample/diagnostics;
7. import normalization/provenance;
8. verification checklists;
9. analytics expansion;
10. offline/mobile resilience;
11. operational release.

Every feature must add:

- migration if needed;
- service/store logic;
- controller;
- route;
- authorization;
- validation;
- focused tests;
- integration test where applicable;
- UI changes;
- documentation;
- verification command.

## Commit discipline

One logical change per commit.

Examples:

```bash
git add server/store.js server/store.crud.test.js
git commit -m "test: align store mocks with current query contract"
```

Then:

```bash
npm test
git status
git log -1 --oneline
git push origin main
```

Do not commit a red test suite unless the commit is explicitly a diagnostic checkpoint and is clearly labeled.

## Definition of done

A phase is complete only when:

- implementation exists;
- tests exist;
- tests pass;
- migration is verified;
- security is checked;
- UI is checked;
- documentation is updated;
- Git status is understood;
- commit exists;
- remote push succeeds;
- next step is recorded.
