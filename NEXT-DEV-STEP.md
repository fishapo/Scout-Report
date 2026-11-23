# NEXT DEV STEP — PHASE 21

Phase 20 is complete: collect → inventory → map → approve → code.

**Next:** implement the approved canonical schema in PostgreSQL using migration `004_expanded_scouting_model.sql`, preserving all current report/workflow contracts.

Before running Phase 21 in Termux:
```bash
npm ci
npm run verify:phase20
npm test
```

Then commit:
```bash
git add .
git commit -m "feat: complete phase 20 canonical scouting data inventory"
git push origin main
```
