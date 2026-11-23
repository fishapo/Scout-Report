# Scout Report — Local Verification Snapshot — 10 August 2026

## Current result

The Phase 17 project archive was inspected and its source verification gate was executed successfully.

- Phase 17 gate: **55/55 PASS**
- Clean dependency install: **PASS** in the operator environment
- Express 4.22.2: **PASS**
- dotenv 16.4.7: **PASS**
- pg 8.22.0: **PASS**
- Login page: **PASS**
- Login API: **PASS**
- Authenticated dashboard routing: **PASS**
- PostgreSQL-backed browser flow: **PASS** from supplied runtime evidence

## Local entry

Run:

```bash
npm ci
npm start
```

Then open the URL printed by the server. The default is:

```text
http://localhost:3000/
```

If port 3000 is busy, the server automatically selects the next available port. The latest operator run selected port 3003.

## Login

Use:

```text
http://localhost:<selected-port>/login
```

The root `/` also serves the login page when the browser has no authenticated access cookie.

## Important verification note

The latest clean-install evidence does not include a fresh `npm test` output. Run it before treating the local release as fully regression-green.

## Next phase

Phase 18: CI execution, staging smoke acceptance, PostgreSQL backup/restore drill, rollback drill, measured reliability evidence, and protected promotion.
