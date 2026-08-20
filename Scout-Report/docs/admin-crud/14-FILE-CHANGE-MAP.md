# 14. File Change Map

## Existing files that should remain stable

### `server/routes/reference.routes.js`

Current scout-facing read routes.

**Action:** preserve.

### `server/controllers/reference.controller.js`

Current raw-array/object response contract.

**Action:** preserve.

### `previews/user-form.html`

Scout reference consumer.

**Action:** no CRUD-specific changes initially.

### `server/store.js`

Active PostgreSQL-backed store.

**Action:** extend carefully or extract reference repository functionality; do not rewrite report behavior.

## Existing files likely to be modified

### `server/routes/index.js`

Mount the new admin reference router.

### `server/app.js`

Usually no change should be necessary if `/api` is already mounted correctly. Modify only if the route structure requires it.

### `server/store.js`

Only if using it for the new CRUD repository operations.

### `previews/admin-dashboard.html`

Add management UI.

### test files

Add/extend tests for admin reference routes and store/service behavior.

## New files recommended

```text
server/routes/admin/reference.routes.js

server/controllers/admin/reference/
  farms.controller.js
  cropTypes.controller.js
  cropVarieties.controller.js
  pests.controller.js
  diseases.controller.js

server/services/admin/reference/
  farms.service.js
  cropTypes.service.js
  cropVarieties.service.js
  pests.service.js
  diseases.service.js
```

If repository extraction is chosen:

```text
server/repositories/reference/
  farms.repository.js
  cropTypes.repository.js
  cropVarieties.repository.js
  pests.repository.js
  diseases.repository.js
```

Tests:

```text
server/admin-reference.routes.test.js
server/admin-reference.service.test.js
server/admin-reference.repository.test.js
```

Only create files that the implementation actually needs; do not create empty abstraction layers for their own sake.
