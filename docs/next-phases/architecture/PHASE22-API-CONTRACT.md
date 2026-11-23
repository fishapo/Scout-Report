# Phase 22 API Contract

All endpoints below are authenticated and role-authorized.

## Full report

`GET /api/reports/:id/full`

Returns the report header, all canonical child domains, current workflow and workflow history.

## Visit metadata

`PATCH /api/reports/:id/visit`

Updates only canonical visit/header extension fields defined by the Phase 21 schema.

## Repeatable observation domains

For each domain, list and create are available:

`GET /api/reports/:id/:domain`  
`POST /api/reports/:id/:domain`

Domains:

- `stops`
- `cropObservations`
- `soilObservations`
- `irrigationObservations`
- `weatherObservations`
- `weeds`
- `nutrients`
- `stress`
- `actions`
- `recommendations`
- `media`
- `samples`

Child records are always linked to the parent report and are subject to the same report/workflow visibility boundary.

## Verification checklist

`GET /api/reports/:id/checklist`  
`PUT /api/reports/:id/checklist`

Approval is rejected until every required item for the active verification gate is complete.
