# 4. Proposed Admin CRUD API Specification

## Namespace

All administrative reference operations:

`/api/admin/reference`

Every endpoint must use:

1. `auth.authenticate`
2. `auth.authorizeRoles("admin")`

## Farms

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/farms` | list farms |
| POST | `/farms` | create farm |
| GET | `/farms/:id` | get one farm |
| PATCH | `/farms/:id` | update farm |
| DELETE | `/farms/:id` | delete/archive farm subject to dependency rules |

Create payload:

```json
{
  "name": "Example Farm",
  "location": "Naivasha"
}
```

Update payload may contain only mutable fields:

```json
{
  "name": "Updated Farm",
  "location": "New Location"
}
```

## Crop types

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/crop-types` | list crop types |
| POST | `/crop-types` | create |
| GET | `/crop-types/:id` | get one |
| PATCH | `/crop-types/:id` | update |
| DELETE | `/crop-types/:id` | delete subject to dependency rules |

## Crop varieties

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/crop-types/:cropTypeId/varieties` | list |
| POST | `/crop-types/:cropTypeId/varieties` | create |
| GET | `/crop-types/:cropTypeId/varieties/:id` | get |
| PATCH | `/crop-types/:cropTypeId/varieties/:id` | update |
| DELETE | `/crop-types/:cropTypeId/varieties/:id` | delete |

Create payload:

```json
{
  "name": "Roma Tomato"
}
```

The parent crop type must exist.

## Pests

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/pests` | list |
| POST | `/pests` | create |
| GET | `/pests/:id` | get |
| PATCH | `/pests/:id` | update |
| DELETE | `/pests/:id` | delete subject to historical-data policy |

Payload:

```json
{
  "name": "New Pest",
  "description": "Description"
}
```

## Diseases

Same structure as pests.

## Status conventions

| Situation | Status |
|---|---:|
| Valid list/get | 200 |
| Created | 201 |
| Updated | 200 |
| Deleted | 204 or documented success response |
| Invalid payload | 400 |
| Missing authentication | 401 |
| Authenticated non-admin | 403 |
| Record not found | 404 |
| Duplicate | 409 |
| Dependency blocks deletion | 409 |
| Unexpected DB/application error | 500 |

## Response convention

The new admin API may use a consistent envelope because it is a new contract.

Recommended:

```json
{
  "success": true,
  "data": {}
}
```

However, consistency matters more than the exact envelope. Once selected, apply it uniformly to all admin CRUD endpoints.

## Error convention

Recommended:

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_REFERENCE",
    "message": "A farm with this name already exists."
  }
}
```

Do not expose raw PostgreSQL errors to browsers.
