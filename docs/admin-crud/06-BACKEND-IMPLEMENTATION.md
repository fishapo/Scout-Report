# 6. Backend Implementation Plan

## Proposed structure

Create an admin reference route/controller/service layer while preserving the existing read controller.

Recommended:

```text
server/
  routes/
    admin/
      reference.routes.js

  controllers/
    admin/
      reference/
        farms.controller.js
        cropTypes.controller.js
        cropVarieties.controller.js
        pests.controller.js
        diseases.controller.js

  services/
    admin/
      reference/
        farms.service.js
        cropTypes.service.js
        cropVarieties.service.js
        pests.service.js
        diseases.service.js
```

For database access, use either:

- dedicated reference repository modules, or
- a carefully extended `server/store.js`.

The preferred choice is to avoid turning `server/store.js` into an unbounded monolith. A repository layer is cleaner if CRUD begins expanding substantially.

## Route mounting

Add an admin reference router under the canonical `/api` router:

```text
/api/admin/reference/*
```

Do not mount the new router over `/api/reference`.

## Controller responsibilities

Controllers should:

- extract route parameters
- validate basic request shape
- invoke service
- map service results to HTTP
- call `next(error)` for centralized error handling

Controllers should not contain large SQL statements.

## Service responsibilities

Services should:

- normalize strings
- enforce business rules
- perform duplicate checks where useful
- enforce parent/child relationships
- decide deletion eligibility
- translate low-level errors into domain errors

## Repository responsibilities

Repositories should:

- execute parameterized SQL
- return normalized database records
- use transactions where multiple writes must be atomic
- avoid string-interpolated user values in SQL

## Validation

At minimum:

### Names

- required
- trim leading/trailing whitespace
- reject empty values
- enforce a sensible length limit consistent with the DB
- prevent duplicates

### Location

- optional
- trim
- enforce 255-character DB limit

### Description

- optional
- trim
- enforce a documented maximum

### IDs

- validate route parameter format
- never trust client-generated IDs for normal creation

## Duplicate handling

Use database uniqueness as the final authority.

Translate PostgreSQL `23505` into HTTP 409.

Do not rely only on a pre-check because concurrent requests can still race.

## Foreign-key handling

Translate PostgreSQL `23503` into a domain-specific conflict.

Do not return generic “database constraint failed” messages when the application can explain the dependency.

## Transactions

Use transactions when:

- deleting/updating related records
- implementing coordinated historical updates
- writing audit entries together with the mutation

Simple single-row inserts/updates do not necessarily require explicit transactions.

## Error handling

Extend the existing error normalization pattern rather than introducing a second global error system.

The active store already translates several PostgreSQL errors to user-safe messages.

## Avoid modifying

Unless required by a discovered bug:

- `server/controllers/reference.controller.js`
- existing `server/routes/reference.routes.js`
- scout form reference-loading logic
- existing report reference validation
