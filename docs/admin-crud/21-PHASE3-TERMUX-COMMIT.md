# Phase 3 — Termux Commit Prompt

After implementing and verifying Crop Type CRUD:

```bash
git status
git diff -- server/store.js server/routes/index.js server/routes/admin server/controllers/admin scripts package.json docs/admin-crud
npm run verify:phase1
npm run verify:phase2
npm test

git add server/store.js server/routes/index.js server/routes/admin server/controllers/admin server/*test.js scripts package.json docs/admin-crud NEXT-DEV-STEP.md PHASE2-COMPLETE.txt
git commit -m "feat: add admin crop type crud"
git status
git log -1 --oneline
```

If `npm test` is blocked by missing dependencies, install dependencies in the real development environment first and rerun the full suite before committing.
