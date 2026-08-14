# Phase 22–27 API Structure

## Report extensions
- `POST /api/reports` — create report header and initial child records.
- `GET /api/reports/:id/full` — canonical report with observations, actions, evidence and workflow.
- `PATCH /api/reports/:id/visit` — visit metadata.
- `POST /api/reports/:id/stops` — add survey stop.
- `POST /api/reports/:id/weeds` — add weed observation.
- `POST /api/reports/:id/crop-observations` — add crop/stand observation.
- `POST /api/reports/:id/soil-observations` — add soil observation.
- `POST /api/reports/:id/weather-observations` — add detailed weather observation.
- `POST /api/reports/:id/actions` — add management action.
- `POST /api/reports/:id/recommendations` — add recommendation.
- `POST /api/reports/:id/samples` — register sample.
- `POST /api/reports/:id/media` — attach evidence.

## Import
- `POST /api/imports/validate` — dry-run, no writes.
- `POST /api/imports/commit` — commit validated rows as drafts.
- `GET /api/imports/:id` — batch summary.
- `GET /api/imports/:id/errors` — row-level errors.
- `GET /api/imports/:id/reconciliation` — accepted/rejected/duplicate/unmapped summary.

## Verification
Existing workflow routes remain authoritative. Add checklist support behind them:
- `GET /api/workflow/:id/checklist`
- `PUT /api/workflow/:id/checklist`
- `POST /api/workflow/:id/verify`

The server must reject approval/forwarding when required checklist items are incomplete.
