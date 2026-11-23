# Deployment — Analytics & User Management Rebase

## 1. Install

```bash
npm ci
```

## 2. Configure

Copy `.env.example` to `.env` and set the PostgreSQL connection and `JWT_SECRET`.

## 3. Migrate

```bash
npm run migrate
```

The migration chain now includes:
- `001`/initial schema
- `002_report_workflow.sql` — four-role verification workflow
- `003_analytics_indexes.sql` — dashboard query indexes

## 4. Test

```bash
npm test
```

The packaging environment used for this release did not contain npm's runtime dependencies, so the full suite must be run after `npm ci` in the development environment.

## 5. Start

```bash
npm start
```

The application continues to choose the next available development port according to the existing server bootstrap.
