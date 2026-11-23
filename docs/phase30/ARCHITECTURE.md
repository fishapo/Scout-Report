# Scout Report Phase 30 — Submission Architecture

```text
┌───────────────────────────────┐
│ Browser / Scout Report Form   │
│ user-form.html                │
│                               │
│ Reference loading             │
│ Autofill from DB              │
│ Editable report values        │
└───────────────┬───────────────┘
                │ authenticated JSON
                │ POST /api/reports
                ▼
┌───────────────────────────────┐
│ Express API Route             │
│ report.routes.js              │
│ authenticate                  │
│ authorizeRoles                │
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│ Report Controller             │
│ report.controller.js          │
│ createReport()                │
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│ PostgreSQL Store              │
│ store.js                      │
│                               │
│ normalize farm/crop/variety   │
│ resolve pest/disease refs     │
│ derive status                 │
│ transaction                   │
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│ PostgreSQL                    │
│                               │
│ scout_reports                 │
│ pest_observations             │
│ disease_observations          │
│ report_workflows              │
│ report_workflow_events        │
│ canonical observation tables  │
└───────────────┬───────────────┘
                │
                │ response / canonical extension
                ▼
┌───────────────────────────────┐
│ Canonical Observations        │
│ canonical-observations.js     │
│                               │
│ stops                         │
│ cropObservations              │
│ soilObservations              │
│ irrigationObservations        │
│ weatherObservations           │
│ weeds / nutrients / stress    │
│ actions / recommendations     │
│ media / samples               │
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│ HTTP response / reload        │
│ report returned to browser    │
│ latest report available for    │
│ authenticated Autofill        │
└───────────────────────────────┘
```

## Data-integrity rule

The application must never remove legitimate fields from the report payload merely to make an INSERT succeed. The database schema and migration chain must instead match the application's canonical report contract.
