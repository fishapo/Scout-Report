# Authentication Regression Fix — 2026-08-12

## Scope
Fix the 401 browser/API authentication boundary before Phase 22.

## Root cause addressed
Browser page authentication previously contained a second token-resolution path (`getUserForToken`) separate from the canonical Express authentication middleware. This could make cookie/session behavior diverge from API behavior and made test doubles exercise different authentication pipelines.

## Code change
`server/middleware/requirePageAuth.js` now delegates authentication exclusively to `auth.authenticate`.

The canonical `auth.authenticate` already accepts both:
- `Authorization: Bearer <token>`
- `access_token` cookie

401 errors are converted to `/login` for browser pages; non-authentication errors continue to the global error handler.

## Roles preserved
- `scout`
- `inter_farm_supervisor`
- `head_of_department`
- `admin`

No role was removed or renamed.

## Regression coverage
- Bearer authentication
- HttpOnly cookie authentication
- expired/invalid session behavior
- all four application roles
- `/dashboard` routing
- `/api/dashboard` authorization
- protected report routes
- browser 401 redirect
- API 401 response

## Verification
Static JavaScript syntax checks pass for the changed middleware and application test file.
A dependency-free authentication regression suite is included as `server/auth-regression.test.js` and is executable with Node's built-in test runner.

The full application suite requires the package dependencies (`express`, `dotenv`, `pg`, `cookie-parser`, `cors`). If `npm ci` cannot be completed in the execution environment, run the full gate locally after installing dependencies.
