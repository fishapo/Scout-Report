# Phase Fix — Authentication Regression Verification

Date: 2026-08-12

## Result
PASS for the dependency-free authentication regression layer and JavaScript syntax validation.

## Fixed
`server/middleware/requirePageAuth.js` now uses the canonical `auth.authenticate` middleware instead of maintaining a second `getUserForToken` resolution pipeline.

This guarantees browser pages and protected API routes use the same credential rules:
- Bearer token
- `access_token` cookie
- live session validation
- role authorization

## Regression tests
`server/auth-regression.test.js`: **7/7 PASS**

Covered:
1. Bearer authentication for Scout
2. Bearer authentication for Inter-Farm Supervisor
3. Bearer authentication for Head of Department
4. Bearer authentication for Admin
5. HttpOnly cookie authentication
6. 401 browser redirect for expired/invalid sessions
7. propagation of non-401 page errors

Additional application regression cases were added to `server/app.test.js` for:
- cookie and bearer authentication
- expired/invalid sessions
- all four `/api/dashboard` roles
- `/dashboard` routing
- browser `/login` redirects
- protected report endpoints returning 401

## Static verification
PASS:
- changed middleware syntax
- application test syntax
- authentication role registry
- dashboard route authorization
- protected report route authorization
- canonical authentication path

## Full suite gate
The complete `npm test` suite was not claimable in this build environment because the extracted package has no installed runtime dependencies. `scripts/verify-dependencies.js` reports missing `express`, `dotenv`, `pg`, `cookie-parser`, and `cors`.

Run locally:

```bash
npm ci
npm run verify:auth-fix
npm test
```

## Role policy
No role was removed. The supported workflow remains:

Scout → Inter-Farm Supervisor → Head of Department → Admin

with verification at every hand-off.
