# Phase 22 HOD Workflow & Authentication Remediation — 2026-08-12

## Executive finding

The Phase 22 baseline **does contain the Head of Department workflow role, route and dashboard**.

Verified implementation:

- Role: `head_of_department`
- Browser route: `/head-of-department-dashboard`
- Shared dashboard API: `GET /api/dashboard`
- Workflow API: `/api/workflow/*`
- Role assignment: `PATCH /api/admin/users/:id/role`
- Admin user creation supports `head_of_department`
- HOD dashboard is restricted to `head_of_department`
- Workflow order remains:

`scout -> inter_farm_supervisor -> head_of_department -> admin -> approved`

## Login problem reported

The message `Invalid email or password` is produced by the canonical login service when either:

1. `lathyflora69@gmail.com` is not present as an active user in the PostgreSQL `users` table; or
2. the stored password hash does not match the password entered.

The role itself does **not** authenticate an account. A user must exist with an active account and a valid password.

## Remediation implemented

Administrators can now reset a user's password without changing that user's role.

### API

`PATCH /api/admin/users/:id/password`

Request:

```json
{"password":"NewSecurePassword123!"}
```

Rules:

- minimum 8 characters
- administrator only
- existing active sessions for that user are revoked
- role is preserved
- the password is stored as a PBKDF2-SHA256 hash

### Admin UI

`/admin-users` now has **Reset Password** for each user.

Recommended operational sequence:

1. Log in as Administrator.
2. Open **User & Role Management**.
3. Find `lathyflora69@gmail.com`.
4. Confirm the role is **Head of Department**.
5. Use **Reset Password**.
6. Give the new temporary password to the HOD securely.
7. HOD logs in and is routed to `/head-of-department-dashboard`.

If the email is not listed, create the account from the same Admin page with role **Head of Department**.

## Verification

Passed:

- HOD route/static implementation verification
- HOD role presence verification
- workflow role ordering verification
- admin role-management route verification
- admin password-reset implementation verification
- password reset controller regression tests: **2/2 PASS**
- Phase 22 contract tests: **5/5 PASS**

The existing operator baseline supplied for Phase 21 remains:

- `npm run verify:auth-fix`: **7/7 PASS**
- previous complete test run: **92 PASS / 0 FAIL / 2 SKIPPED**

A fresh complete `npm test` could not be executed in this packaging container because required npm runtime packages (`express`, `dotenv`, `pg`, `cookie-parser`, `cors`) were unavailable to the dependency verifier. This is an environment/dependency-install gate, not a reported test failure. Run `npm ci` in the target project directory before the final full-suite verification.

## Next measure

Proceed to the next milestone only after the target environment reports:

```text
npm ci
npm run verify:auth-fix
npm run verify:hod-workflow
npm test
```

Then continue:

**collect -> inventory -> map -> approve -> code -> test -> verify**
