# 3. Existing Scout-Facing API Contract

This contract must remain stable during admin CRUD development.

## Canonical reference endpoints

| Method | Endpoint | Current purpose | Compatibility requirement |
|---|---|---|---|
| GET | `/api/reference` | all reference data | preserve |
| GET | `/api/reference/farms` | farm array | preserve |
| GET | `/api/reference/crop-types` | crop types with `varieties` | preserve |
| GET | `/api/reference/crop-types/:id/varieties` | varieties for one crop | preserve |
| GET | `/api/reference/pests` | pest array | preserve |
| GET | `/api/reference/diseases` | disease array | preserve |

## Response shapes

### Farms

```json
[
  {
    "id": "FARM-001",
    "name": "Green Valley Farm",
    "location": "East County"
  }
]
```

### Crop types

```json
[
  {
    "id": "CROP-001",
    "name": "Tomato",
    "varieties": [
      "Cherry Tomato",
      "Beefsteak Tomato"
    ]
  }
]
```

### Individual varieties

```json
{
  "varieties": [
    "Cherry Tomato",
    "Roma Tomato"
  ]
}
```

### Pests

```json
[
  {
    "id": "PEST-001",
    "name": "Whitefly",
    "description": "Small white insects"
  }
]
```

### Diseases

```json
[
  {
    "id": "DISEASE-001",
    "name": "Early Blight",
    "description": "Brown spots on leaves"
  }
]
```

## Critical compatibility rule

Do not convert these endpoints to a `{ success, data }` envelope.

The current controller documentation explicitly records that the preview frontend expects raw arrays/objects.

## New admin namespace

The proposed administrative contract is separate:

`/api/admin/reference/*`

This avoids changing the existing scout contract and creates a clear security boundary.
