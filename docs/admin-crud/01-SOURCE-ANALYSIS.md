# 1. Intensive Source Analysis

## 1.1 Current application shape

The project is a Node.js/Express application using PostgreSQL through `pg`.

Primary runtime:

- `server/index.js` — startup, DB availability check, dynamic port selection, graceful shutdown
- `server/app.js` — Express bootstrap and browser/API routing
- `server/routes/index.js` — canonical `/api` route mounting
- `server/store.js` — primary PostgreSQL-backed report/reference store
- `server/db.js` — PostgreSQL pool, query and transaction helpers
- `server/auth.js` — authentication, JWT/session resolution and role authorization

The project also contains a legacy-compatible `server/db-store.js`. The active reference controller explicitly identifies `server/store.js` as the single source of truth. The CRUD work should therefore extend the active store architecture rather than creating another competing reference model.

## 1.2 Current reference read path

Current canonical path:

`GET /api/reference/*`
→ `server/routes/index.js`
→ `server/routes/reference.routes.js`
→ `server/controllers/reference.controller.js`
→ `server/store.js`
→ PostgreSQL

The controller intentionally returns raw arrays/objects because the existing preview frontend expects those response shapes.

Current reference operations:

- `GET /api/reference`
- `GET /api/reference/farms`
- `GET /api/reference/crop-types`
- `GET /api/reference/crop-types/:id/varieties`
- `GET /api/reference/pests`
- `GET /api/reference/diseases`

The existing store performs the reference reads concurrently and assembles crop varieties into each crop type.

## 1.3 Current authentication model

`server/auth.js` already provides:

- `authenticate`
- `authorizeRoles(...roles)`
- token extraction from Bearer authorization or access-token cookie
- live session/user resolution
- `admin` and `scout` role support

Existing report routes demonstrate the correct pattern:

`auth.authenticate`
→ `auth.authorizeRoles("admin")`
→ controller

The admin CRUD layer should reuse this exact authorization mechanism.

Do not create a second authorization middleware unless inspection during implementation proves a missing capability.

## 1.4 Current page authorization

`server/middleware/requirePageAuth.js` protects browser pages.

`/admin-dashboard.html` is already protected with:

- authentication
- admin role

`/scout-form` permits scout and admin.

This is a useful UI boundary, but it is not sufficient to secure CRUD. API endpoints must independently enforce authorization.

## 1.5 Current admin dashboard

`previews/admin-dashboard.html` currently contains a Reference Data section.

It already loads:

- farms
- crop types, including varieties
- pests
- diseases

The current UI is read-only.

The next UI stage should replace/extend the cards with management controls while preserving the existing display semantics used by the dashboard.

## 1.6 Current scout form dependency

`previews/user-form.html` consumes reference data for:

- Farm selection
- Crop Type selection
- Variety selection
- Pest Type selection
- Disease Type selection

The server also validates submitted references through `server/store.js`.

Examples:

- farm is resolved against `farms`
- crop type is resolved against `crop_types`
- variety is validated against the selected crop type
- pest/disease observations are resolved against their reference tables

Therefore reference CRUD is operationally important: changes immediately affect what scouts can select and what the server accepts.

## 1.7 Current report data model

`scout_reports.farm_id` has a foreign key to `farms(id)` with `ON DELETE CASCADE`.

This is a critical finding.

Deleting a farm can cascade into deletion of historical scout reports.

That means a generic CRUD implementation that simply issues `DELETE FROM farms WHERE id = $1` is unsafe for the intended administrative product.

The delete policy must be decided before production CRUD is enabled.

## 1.8 Current tests

The project has tests covering:

- application routing
- authentication
- authorization
- browser/session behavior
- reference read endpoints
- report controller behavior
- store validation
- report CRUD behavior
- status derivation
- security headers
- throttling

Existing route tests specifically establish that scouts are rejected from admin-only report operations and admins are permitted.

The admin reference CRUD test suite should follow this established pattern.

## 1.9 Important architecture decisions already present

1. PostgreSQL is the source of truth.
2. `server/store.js` is the active reference/report store.
3. Existing reference response shapes are intentionally raw arrays/objects.
4. Authentication is JWT-backed with revocable sessions.
5. Roles are `admin` and `scout`.
6. The admin dashboard is already role-protected.
7. The server dynamically selects the next available port.
8. The default development command is `node server/index.js`.
9. Reference reads currently execute several independent DB queries concurrently.
10. The existing project already has regression tests; CRUD should extend rather than bypass them.

## 1.10 Main conclusion

The safest implementation is additive:

`/api/reference/*` remains unchanged.

New write/read-admin endpoints use:

`/api/admin/reference/*`

with:

`authenticate`
→ `authorizeRoles("admin")`
→ admin controller
→ reference service
→ active PostgreSQL store/repository layer.

The scout form should require no API contract rewrite.
