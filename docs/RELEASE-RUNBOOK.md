# Scout Report Release Runbook

## Clean install

```bash
npm ci
npm run verify:phase9
npm test
```

## PostgreSQL via Docker

```bash
docker compose up -d postgres
docker compose ps
```

The compose file exposes PostgreSQL on host port `5433` and initializes the schema from `server/migrations/init.sql` on first volume creation.

## Environment

Copy `.env.example` to `.env` and provide database credentials plus a long random `JWT_SECRET`.

Never commit `.env`.

## Runtime

```bash
npm start
```

Check:

```text
/api/health
```

A healthy response must report a connected database.

## Release gate

```bash
npm run release:check
npm test
```

Then perform real browser/API acceptance before creating a release candidate.
