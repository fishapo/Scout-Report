# Phase 2 Start Pack — Admin Reference CRUD API Foundation

Phase 1 has established the schema/dependency safety gate.

## Objective

Build the authorization and routing foundation for:

```text
/api/admin/reference/*
```

without changing the existing scout read API.

## First implementation target

Start with **Farms** only.

Do not implement all five entities in one change.

## Required security behavior

| Requester | Expected |
|---|---:|
| anonymous | 401 |
| authenticated scout | 403 |
| authenticated admin | allowed |

Reuse:

```js
auth.authenticate
auth.authorizeRoles("admin")
```

## Proposed route foundation

Create:

```text
server/routes/admin/reference.routes.js
```

Mount it under the canonical `/api` router as:

```text
/api/admin/reference
```

The first farm endpoints should be:

```text
GET    /api/admin/reference/farms
POST   /api/admin/reference/farms
GET    /api/admin/reference/farms/:id
PATCH  /api/admin/reference/farms/:id
DELETE /api/admin/reference/farms/:id
```

## Farm deletion gate

Do not issue an unconditional SQL delete.

The migration confirms:

```text
scout_reports.farm_id → farms.id ON DELETE CASCADE
```

The first implementation should therefore use a dependency check and return a conflict for referenced farms.

Recommended conflict:

```http
409 Conflict
```

with a safe application error such as:

```json
{
  "success": false,
  "error": {
    "code": "REFERENCE_IN_USE",
    "message": "This farm is used by existing scout reports and cannot be deleted."
  }
}
```

## First Phase 2 test set

Before building the dashboard UI, make the API pass:

1. anonymous GET → 401
2. scout GET → 403
3. admin GET → 200
4. admin POST valid → 201
5. admin POST duplicate → 409
6. admin GET missing → 404
7. admin PATCH valid → 200
8. admin PATCH duplicate → 409
9. admin DELETE unused → documented success
10. admin DELETE referenced → 409
11. existing `/api/reference/farms` still works

## Commit

```bash
git add server/routes server/controllers server/services server/store.js server/*.test.js package.json docs scripts

git commit -m "feat: add admin reference api foundation"
```

Then run the complete suite before moving to Crop Types.
