# 10. Phase-by-Phase Execution Checklist

## Phase 0 — Freeze baseline

- [ ] extract/verify current project
- [ ] run tests
- [ ] run UI verification
- [ ] run server verification
- [ ] verify admin login
- [ ] verify scout login
- [ ] verify reference reads
- [ ] create baseline Git commit

Suggested commit:

`chore: establish admin reference crud baseline`

## Phase 1 — Schema and dependency audit

- [ ] inspect actual DB schema
- [ ] inspect foreign keys
- [ ] inspect production/reference data if available
- [ ] decide farm deletion policy
- [ ] decide crop deletion policy
- [ ] document pest/disease rename behavior

Deliverable:

`docs/REFERENCE-DATA-SCHEMA.md`

## Phase 2 — Admin API foundation

- [ ] create admin reference router
- [ ] mount under `/api/admin/reference`
- [ ] apply `auth.authenticate`
- [ ] apply `auth.authorizeRoles("admin")`
- [ ] establish admin response/error convention
- [ ] add route tests

Commit:

`feat: add admin reference api foundation`

## Phase 3 — Farm CRUD

- [ ] repository/store operations
- [ ] service
- [ ] controller
- [ ] routes
- [ ] validation
- [ ] duplicate handling
- [ ] dependency-safe delete
- [ ] tests
- [ ] read API regression

Commit:

`feat: add admin farm crud`

## Phase 4 — Crop Type CRUD

- [ ] CRUD
- [ ] validation
- [ ] duplicate handling
- [ ] variety dependency behavior
- [ ] tests

Commit:

`feat: add admin crop type crud`

## Phase 5 — Variety CRUD

- [ ] parent validation
- [ ] scoped uniqueness
- [ ] CRUD
- [ ] tests
- [ ] read API regression

Commit:

`feat: add admin crop variety crud`

## Phase 6 — Pest CRUD

- [ ] CRUD
- [ ] duplicate handling
- [ ] description
- [ ] historical observation behavior
- [ ] tests

Commit:

`feat: add admin pest crud`

## Phase 7 — Disease CRUD

- [ ] CRUD
- [ ] duplicate handling
- [ ] description
- [ ] historical observation behavior
- [ ] tests

Commit:

`feat: add admin disease crud`

## Phase 8 — Admin dashboard

- [ ] reusable API client
- [ ] farms management
- [ ] crop types
- [ ] varieties
- [ ] pests
- [ ] diseases
- [ ] add modal
- [ ] edit modal
- [ ] delete confirmation
- [ ] validation display
- [ ] 401 handling
- [ ] 403 handling
- [ ] 409 handling
- [ ] loading states
- [ ] empty states

Commit:

`feat: add admin reference management ui`

## Phase 9 — Full regression

- [ ] full test suite
- [ ] scout form
- [ ] admin dashboard
- [ ] reference API
- [ ] reports
- [ ] authentication
- [ ] authorization
- [ ] dynamic port startup

Commit:

`test: add admin reference crud regression suite`

## Phase 10 — Audit trail

- [ ] audit schema
- [ ] audit service
- [ ] mutation logging
- [ ] tests
- [ ] admin audit view decision

Commit:

`feat: add reference data audit logging`

## Phase 11 — Performance

- [ ] profile reference reads
- [ ] profile CRUD
- [ ] inspect duplicate DB connections/logs
- [ ] optimize only where measured
- [ ] regression test

Commit:

`perf: optimize reference data loading`
