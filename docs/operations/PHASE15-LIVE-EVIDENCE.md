# Phase 15 — Live Production Certification Evidence

Use this record against the exact release commit. Do not mark an item passed without evidence.

## Release identity
- Commit SHA:
- Version:
- Release artifact SHA-256:
- CI run URL:

## CI
- Clean `npm ci`: [ ]
- Phase 1–15 gates: [ ]
- Full `npm test`: [ ]
- PostgreSQL integration: [ ]
- Release artifact generated: [ ]

## Staging
- Staging URL:
- Deployment timestamp:
- `/api/health`: [ ]
- `/api/reference/farms`: [ ]
- Admin metrics unauthorized: [ ]
- Admin metrics authorized: [ ]
- `x-request-id` correlation: [ ]
- Scout Form regression: [ ]
- Admin Dashboard regression: [ ]

## Disaster recovery
- Backup timestamp:
- Backup artifact/checksum:
- Disposable restore database:
- Restore result: [ ]
- Restored schema verification: [ ]
- Restored reference-data verification: [ ]

## Rollback
- Known-good artifact:
- Rollback trigger:
- Rollback execution timestamp:
- Post-rollback health: [ ]
- Post-rollback smoke: [ ]
- Reference API regression: [ ]

## Production
- Approval record:
- Deployment timestamp:
- `/api/health`: [ ]
- `/api/admin/metrics`: [ ]
- Error-rate observation: [ ]
- Latency observation: [ ]
- 15-minute observation: [ ]
- 1-hour observation: [ ]

## SLO baseline
### First 7 days
- Availability:
- 5xx rate:
- Average latency:
- Backup freshness:
- Incident count:

### First 30 days
- Availability:
- 5xx rate:
- Average latency:
- Incident count:
- Reliability trend:

## Post-release review
- What worked:
- What failed:
- Corrective actions:
- Reliability priorities:
- Feature priorities:
- Owner:
- Review date:

> A blank field is evidence not yet collected, not a pass.
