# Phase 17 — Local Acceptance Evidence

## Evidence source
This record captures operator evidence supplied after Phase 16 from the Windows Git Bash development environment. It is not a substitute for GitHub Actions, staging, or production evidence.

## Dependency recovery
Commands executed:

```text
rm -rf node_modules
npm cache verify
npm config get registry
npm ci --registry=https://registry.npmjs.org/
```

Result:

- `npm ci`: PASS
- Packages added: **115**
- Express: **4.22.2**
- dotenv: **16.4.7**
- pg: **8.22.0**
- npm registry: `https://registry.npmjs.org/`
- `npm ls express dotenv pg`: PASS

## PostgreSQL verification
Operator verified:

- PostgreSQL: **17.10**
- Database: **scout_report**
- User: **scout_user**
- Host: `localhost`
- Port: `5432`
- Required reference/report/auth tables present: **10 tables observed**

## Full runtime suite
Command:

```text
RUN_DB_INTEGRATION=1 npm test
```

Observed result:

- Tests: **68**
- Passed: **67**
- Failed: **0**
- Skipped: **1**
- PostgreSQL-backed integration boundary: **PASS**

The single skipped test is explicitly conditional (`getReference returns farms and crop types when database is available`) and is not a failure. The PostgreSQL-backed health/reference/admin-metrics integration test passed.

The authentication-required, forbidden, and invalid-filter error lines printed during the suite are expected negative-path assertions; Node reported the corresponding tests as passing.

## Phase 16 regression
Operator also supplied:

- `npm run verify:phase16`: **56/56 PASS**

## Evidence boundary
The following are **not claimed as executed by this local record**:

- GitHub Actions run URL
- externally deployed staging URL
- production deployment approval
- production SLO measurements
- production rollback execution
- production backup/restore drill
- 7-day/30-day operational measurements

These remain Phase 18 infrastructure-execution gates.
