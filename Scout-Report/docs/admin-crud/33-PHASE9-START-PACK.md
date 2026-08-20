# Phase 9 Start Pack — Production Hardening & Environment Reproducibility

## Objective

Close the remaining Phase 8 runtime acceptance gate and harden the project for repeatable development, staging and production execution.

## Priority 1 — Dependency reproducibility

1. Resolve the locked `xtend@4.0.2` package-mirror failure.
2. Confirm `npm ci` succeeds from a clean directory.
3. Record Node/npm versions used for the release.
4. Keep `package-lock.json` synchronized with `package.json`.
5. Add a documented clean-install verification command.

## Priority 2 — PostgreSQL integration

1. Start PostgreSQL using the supplied `docker-compose.yml` or the project's supported local setup.
2. Apply `server/migrations/init.sql`.
3. Configure `.env` from `.env.example`.
4. Create admin and scout test users.
5. Run the complete `npm test` suite.
6. Execute real HTTP CRUD tests against PostgreSQL.

## Priority 3 — Security hardening

- Verify JWT/session expiry.
- Verify cookie flags in the deployed configuration.
- Verify authorization bypass attempts.
- Verify malformed IDs and payloads.
- Verify duplicate handling under concurrent requests.
- Verify rate limiting and security headers.
- Review production secrets and default development secrets.

## Priority 4 — Release acceptance

- Full runtime suite green.
- PostgreSQL integration green.
- Browser acceptance green.
- Public `/api/reference/*` contract unchanged.
- Admin CRUD all five domains green.
- No destructive historical-data cascades.
- Clean install documented and repeatable.

## Next coding measure

Do not add another application feature until the runtime gate is closed. Phase 9 should first make the project reproducibly installable and runnable, then perform the final production hardening pass.
