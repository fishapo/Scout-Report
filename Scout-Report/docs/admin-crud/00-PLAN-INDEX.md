# Scout Report — Admin Reference Data CRUD Plan

## Purpose

This package is the implementation blueprint for the next Scout Report development stage:

> Establish a secure, admin-only CRUD layer for Farms, Crop Types, Crop Varieties, Pests and Diseases while preserving the existing read API used by the Scout Report form.

## Source basis

This plan was generated from an intensive inspection of the supplied `Scout-Report-next-dev(1).zip` project snapshot, including:

- Express application bootstrap and routing
- PostgreSQL schema and migration
- Authentication and role authorization
- Reference controllers/routes
- PostgreSQL store and validation logic
- Report store/controller/routes
- Admin dashboard
- Scout form
- Browser/auth tests
- Application tests
- Store CRUD/validation tests
- Existing project documentation, route audits and verification artifacts
- Package configuration and startup/verification scripts

## Document map

| File | Purpose |
|---|---|
| `01-SOURCE-ANALYSIS.md` | Current-state architecture and findings |
| `02-DATABASE-REFERENCE-SCHEMA.md` | Actual reference tables, keys and dependencies |
| `03-CURRENT-API-CONTRACT.md` | Existing read API that must remain stable |
| `04-ADMIN-CRUD-API-SPEC.md` | Proposed admin endpoint contract |
| `05-SECURITY-AUTHORIZATION.md` | Authentication/authorization design |
| `06-BACKEND-IMPLEMENTATION.md` | Controller/service/repository implementation plan |
| `07-ADMIN-UI-PLAN.md` | Dashboard CRUD UX and client architecture |
| `08-DATABASE-MIGRATION-STRATEGY.md` | Migration, IDs, constraints and delete policy |
| `09-TEST-AND-REGRESSION-PLAN.md` | Unit, integration, security and regression testing |
| `10-PHASE-BY-PHASE-CHECKLIST.md` | Execution checklist and commits |
| `11-RISK-REGISTER.md` | Risks, mitigations and decision gates |
| `12-DEFINITION-OF-DONE.md` | Completion criteria |
| `13-NEXT-DEV-EXECUTION-PROMPT.md` | Ready-to-use prompt for the next coding session |
| `14-FILE-CHANGE-MAP.md` | Existing files to inspect/modify and files to create |
| `15-IMPLEMENTATION-ORDER.md` | Recommended order that minimizes regression risk |

## Non-negotiable architecture rule

The existing scout-facing endpoints under `/api/reference/*` are the compatibility contract. New administrative mutations must be added under an admin namespace and must not require the scout form to change.

## Current status

The supplied project already contains a functioning PostgreSQL-backed reference read layer and an admin dashboard reference-data display. The next stage is therefore a controlled extension, not a rewrite.
