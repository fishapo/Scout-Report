# Dashboard Role Regression Fix — 2026-08-12

## Problem
The regression test `all four roles can access the shared API dashboard` failed with:

`AssertionError: 'scout' == 'inter_farm_supervisor'`

The production dashboard route already authorizes all four roles. The failure was caused by the test harness retaining the cached `server/routes/dashboard.routes.js` module between `loadAppWithMocks()` calls. That cached route retained the first mocked `auth` module, whose user was the scout.

## Fix
Updated `server/app.test.js` so `./routes/dashboard.routes` is explicitly removed from `require.cache` whenever the mocked application is rebuilt.

This keeps the dashboard route bound to the current mocked authentication context on every role iteration.

## Roles covered
- scout
- inter_farm_supervisor
- head_of_department
- admin

## Expected result
The existing regression should now return HTTP 200 for `/api/dashboard` for each role and `res.body.dashboard.role` should match the role under test.

## Verification performed in build environment
- JavaScript syntax checks passed for the modified test and dashboard route/controller.
- Full `npm test` could not be re-run in the packaging environment because the extracted project does not contain `node_modules` and dependency installation was unavailable in the build container.

## Verification to run locally
```bash
npm ci
npm run verify:auth-fix
npm test
```

Expected final test summary:
- 0 failures
- 2 skipped integration tests when PostgreSQL integration is not enabled

Do not proceed to Phase 22 until the local commands above complete successfully.
