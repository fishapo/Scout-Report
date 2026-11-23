# Phase 19 Dependency Recovery — 2026-08-10

## Observed failure
A local `npm test` attempt in `Z:\Scout-Report\03` reported `Cannot find module 'express'` and `Cannot find module 'dotenv'` from `server/app.js` and `server/db.js`. The failing application tests are therefore dependency-resolution failures, not assertions showing a regression in the tested application behavior.

The same test run recorded 51 passing tests before the application test files loaded, while the dependency-related failures cascaded across app, routing, authentication, reference and report endpoint tests.

## Root cause
`node_modules` was not installed in the Phase 19 working copy at test time. `package.json` and `package-lock.json` declare the required dependencies.

## Fix
1. Added a project `.npmrc` pinning the npm registry to `https://registry.npmjs.org/`.
2. Added `scripts/verify-dependencies.js` to fail early with a precise installation command when required runtime packages are absent.
3. Added `npm run verify:dependencies`.
4. Added `pretest` so `npm test` checks dependencies before loading the test suite.

## Operator recovery
From the project root run:

```bash
rm -rf node_modules
npm cache verify
npm ci --registry=https://registry.npmjs.org/
npm run verify:dependencies
npm test
```

If the final test run is clean, continue with:

```bash
npm run verify:phase19:local
```

Do not treat the dependency-check pass as a substitute for `npm test`; it only confirms that the runtime dependencies can be resolved.

## Verification performed on the updated source package
- `node --check scripts/verify-dependencies.js` — PASS
- `node scripts/verify-phase19.js` — 86/86 PASS
- Dependency checker correctly detects the intentionally absent `node_modules` in the packaging environment and prints the recovery command.

A full `npm test` was not claimed inside the packaging environment because its dependency installation endpoint was unavailable there. The supplied Windows/Git Bash environment must perform the clean `npm ci` and full test execution.
