# NEXT DEV PROMPT — PHASE 20

Use the current project tree in this package as the baseline. Do not redesign authentication, roles or workflow.

1. Read `docs/next-phases/NEXT-PHASE-MASTER-PLAN.md`.
2. Read `docs/next-phases/architecture/GAP-ANALYSIS.md`.
3. Read `docs/next-phases/import-mapping/source-adapters.json`.
4. Inventory every existing report field and map it into the canonical dictionary.
5. Do not modify database schema yet.
6. Add/extend tests for the field dictionary and import adapter registry.
7. Run `npm test`.
8. If tests pass, commit:

```bash
git add docs/next-phases server/import
npm test
git commit -m "phase20: establish canonical scout report data contract"
git status
```

Only after Phase 20 is approved should Phase 21 migration work begin.
