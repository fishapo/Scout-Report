# Phase 2 Routing and Database Audit

## Browser flow

1. `GET /` -> login page (or `/dashboard` when an access cookie exists).
2. Successful login/register -> `GET /dashboard`.
3. `GET /dashboard` authenticates the session and redirects by role:
   - `admin` -> `/admin-dashboard.html`
   - `scout` -> `/scout-dashboard`
4. Scout dashboard -> `/scout-form` for report creation.
5. `/user-form.html` is retained only as a compatibility redirect to `/scout-form`.
6. Admin dashboard is role protected and redirects scouts back to `/dashboard`.

## API contract

- `/api` -> API root
- `/api/health` -> API health
- `/api/reference` -> aggregate farms/crops/pests/diseases
- `/api/reference/farms`
- `/api/reference/crop-types`
- `/api/reference/crop-types/:id/varieties`
- `/api/reference/pests`
- `/api/reference/diseases`
- `/api/reports`
- `/api/reports/:id`
- `/api/reports/stats` (admin)
- `/scout-reports/*` retained as a legacy report API

## Database startup fix

`server/db.js` now loads the project `.env` itself. This prevents module-load order from leaving `DB_PASSWORD` undefined when the database pool is constructed. `server/index.js` also loads `.env` from the project root using an absolute path.

If PostgreSQL is supplied by the included Docker Compose file, its host-side port is `5433`; set `DB_PORT=5433` in `.env` when using that container. If the local PostgreSQL service is on `5432`, keep `DB_PORT=5432`.
