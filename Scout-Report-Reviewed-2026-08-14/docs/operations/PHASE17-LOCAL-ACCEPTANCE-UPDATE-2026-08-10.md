# Scout Report — Phase 17 Local Acceptance Update

**Date:** 10 August 2026  
**Environment:** Windows / Git Bash  
**Project path:** `Z:\Scout-Report\02`  
**Node:** 24.17.0 (operator supplied)  
**PostgreSQL:** 17.10 (operator supplied)

## 1. Purpose

This update records the latest operator evidence after the dependency repair and the first successful browser authentication flow. It supersedes only the older local runtime observations; it does not invent CI, staging, or production evidence.

## 2. Dependency Repair

Operator executed:

```text
rm -rf node_modules
npm cache verify
npm ci --registry=https://registry.npmjs.org/
```

Result:

- npm cache verified successfully.
- `npm ci` installed 115 packages successfully.
- Express: 4.22.2
- dotenv: 16.4.7
- pg: 8.22.0

The earlier `MODULE_NOT_FOUND` failures for `express` and `dotenv` were therefore confirmed as an incomplete dependency-tree/environment problem, not an application import defect.

## 3. Phase 17 Gate

Operator executed `npm run verify:phase17` after the clean install.

**Result: 55/55 PASS, 0 failed.**

The gate confirms the Phase 17 release/checkpoint wiring, CI/release evidence boundaries, Phase 16 regression gate, compatibility boundary, and syntax checks.

## 4. Browser Entry Point — FIX VERIFIED

The application now presents the login page at the site root when no authenticated cookie exists.

Canonical local URLs:

- `http://localhost:3000/` — canonical entry point when port 3000 is free.
- `http://localhost:3000/login` — explicit login page.
- If port 3000 is occupied, `server/index.js` selects the next available port. The supplied runtime selected `http://localhost:3003`.

The operator runtime log recorded:

```text
GET /                    200
GET /assets/auth.js      200/304
GET /auth/me             401  (expected while logged out)
POST /auth/login         200
GET /dashboard           302
GET /admin-dashboard.html 200
GET /auth/me             200
```

This establishes that the browser can load the login page, authenticate, resolve the session, and reach the role-appropriate dashboard.

## 5. PostgreSQL-backed Browser Acceptance

The supplied runtime evidence also recorded successful PostgreSQL queries for:

- farms
- crop types
- crop varieties
- pests
- diseases
- report statistics
- reports
- admin reference CRUD lists
- authenticated session lookup and `last_seen_at` updates

The admin dashboard successfully loaded the authenticated reference-data endpoints and nested crop-variety endpoints.

## 6. Expected 401 Observation

The following message is **not a defect**:

```text
AuthError: Authentication required
GET /auth/me 401
```

It occurs when the login page initializes before an authenticated browser session exists. The subsequent successful login and `/auth/me 200` confirm the intended unauthenticated-to-authenticated transition.

## 7. Dynamic Port Behaviour

The application continues to default to port 3000 and automatically selects an available port when 3000 is busy. The latest supplied run used port 3003.

No hard-coded browser URL change is required; browser routes are relative and therefore follow the selected listening port.

## 8. Remaining Verification Boundary

The latest operator evidence supplied in this development session does **not** include a fresh post-`npm ci` `npm test` result. Therefore this update does not claim a new full-suite result from that run.

The previous Phase 17 evidence remains valid only for the run from which it was captured. A fresh `npm test` should be executed from `Z:\Scout-Report\02` after the clean install before the Phase 18 release gate is treated as fully runtime-green.

## 9. Acceptance Status

| Area | Latest status |
|---|---|
| Dependency repair | PASS |
| Express/dotenv/pg resolution | PASS |
| Phase 17 source gate | 55/55 PASS |
| Root login page | PASS |
| Explicit `/login` route | PASS |
| Login API | PASS |
| Authenticated session | PASS |
| Admin dashboard routing | PASS |
| PostgreSQL runtime | PASS from supplied browser evidence |
| Reference API loading | PASS from supplied browser evidence |
| Fresh full `npm test` after clean install | PENDING |
| GitHub Actions live run | PENDING |
| Staging deployment | PENDING |
| Backup/restore drill | PENDING |
| Rollback drill | PENDING |
| Production promotion | PENDING |

## 10. Next Measure — Phase 18

1. Run `npm test` after the clean `npm ci` and retain the complete result.
2. Run the PostgreSQL integration path where available.
3. Commit the verified tree.
4. Run the exact commit through GitHub Actions and retain the workflow URL/artifacts.
5. Deploy the release artifact to staging.
6. Repeat login, Scout dashboard/form, Admin dashboard, reference API and metrics smoke tests in staging.
7. Execute PostgreSQL backup/restore and controlled rollback drills.
8. Only then proceed through the protected production approval boundary.

**Evidence rule:** measured results are recorded exactly as supplied or executed; pending external evidence is never converted to PASS.
