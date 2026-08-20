# Development Baseline — 2026-08-18

The uploaded `29.zip` is the authoritative source snapshot for the next development cycle.

Current state:

- Phase 28 form/reference submission fix is present.
- Root application uses `server/auth.js`; modular auth files are not present in this snapshot.
- JavaScript syntax check: PASS.
- `npm ci --dry-run --ignore-scripts`: PASS.
- Full suite observed: 119/129 passing, 8 failing, 2 skipped.
- Immediate objective: repair test contracts and migration verification before feature work.

Next approved gate:

**Phase 29A — Clean baseline + test contract repair + migration verification.**

Do not start a new data-model feature until Phase 29A is green.
