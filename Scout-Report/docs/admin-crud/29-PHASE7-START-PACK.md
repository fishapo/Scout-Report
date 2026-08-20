# Phase 7 Start Pack — Admin Reference Data Dashboard CRUD UI

## Objective

Connect the existing `previews/admin-dashboard.html` to the now-stable admin reference CRUD APIs without changing the scout-facing reference API.

## API surface to consume

### Farms
`/api/admin/reference/farms`

### Crop Types
`/api/admin/reference/crop-types`

### Crop Varieties
`/api/admin/reference/crop-types/:cropTypeId/varieties`

### Pests
`/api/admin/reference/pests`

### Diseases
`/api/admin/reference/diseases`

## Implementation order

1. Inspect current admin dashboard HTML/JS and preserve existing layout/auth behavior.
2. Add a single admin API client helper for authenticated JSON requests.
3. Implement Farms CRUD UI and error handling.
4. Implement Crop Type + nested Variety UI.
5. Implement Pest CRUD UI.
6. Implement Disease CRUD UI.
7. Add confirmation dialogs and dependency-aware delete messages.
8. Add client-side validation while retaining server-side validation.
9. Add dashboard browser/static tests.
10. Run Phase 1–7 verification and the full runtime suite in a dependency-complete environment.

## Non-negotiable compatibility

Do not change the public scout endpoints under `/api/reference/*`.

Do not put authorization logic solely in browser JavaScript.

Do not silently retry destructive operations.

Do not allow Crop Variety forms to move a variety to a different crop type through a generic edit operation.

## Required UI states

Every resource needs:

- loading;
- empty;
- populated;
- validation error;
- authorization error;
- server error;
- duplicate error;
- dependency-protected delete error;
- success feedback.

## Phase 7 completion gate

The UI is not complete until every CRUD action has a browser/static test or equivalent deterministic verification, all existing reference reads still work, and the API authorization behavior remains unchanged.
