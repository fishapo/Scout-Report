# Scout Report — Release Candidate

Phase 10 final release-candidate preparation is complete at source, documentation, security-hardening, and static verification level.

Required live acceptance environment: Node.js 22.x, npm 10.9.2, PostgreSQL 16+, and normal npm registry access.

```bash
npm ci
npm run verify:phase9
npm run verify:phase10
npm test
```

Then start PostgreSQL, apply `server/migrations/init.sql`, configure `.env`, start the API, and execute HTTP/browser acceptance.

The current execution environment contains an incomplete/stale dependency tree and cannot provide PostgreSQL. Thus live runtime acceptance remains environment-gated.
