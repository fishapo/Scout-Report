# 2. Actual Database Reference Schema

Source: `server/migrations/init.sql`.

## Farms

```sql
farms (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Dependency

`scout_reports.farm_id` references `farms.id` with `ON DELETE CASCADE`.

**Decision gate:** do not expose unrestricted farm deletion until historical-report behavior is explicitly protected.

## Crop types

```sql
crop_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Crop varieties

```sql
crop_varieties (
  id SERIAL PRIMARY KEY,
  crop_type_id VARCHAR(50) NOT NULL REFERENCES crop_types(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (crop_type_id, name)
)
```

Variety uniqueness is scoped to the parent crop type.

Deleting a crop type cascades to its varieties.

## Pests

```sql
pests (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Diseases

```sql
diseases (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Observation dependencies

`pest_observations.pest_type` and `disease_observations.disease_type` store reference **names**, not foreign-key IDs.

The active store resolves these names against `pests` and `diseases` when reports are created/updated.

This has a major CRUD implication:

### Renaming a pest or disease

A rename changes the reference table name but does not automatically update historical observation strings.

Therefore the implementation must choose one of:

1. allow rename and accept historical string preservation;
2. implement coordinated historical-data update;
3. introduce foreign-key IDs in a future schema migration.

For this phase, option 1 is the lowest-risk path, but the behavior must be documented and tested.

## Existing seed data

The schema seeds:

- 3 farms
- 4 crop types
- 10 crop varieties
- 5 pests
- 5 diseases

These are useful for CRUD integration tests and UI verification.

## ID strategy

Current IDs:

- farms: application-supplied strings such as `FARM-001`
- crop types: strings such as `CROP-001`
- pests: strings such as `PEST-001`
- diseases: strings such as `DISEASE-001`
- crop varieties: PostgreSQL `SERIAL`

Do not mix new ID conventions casually.

Recommended phase-one policy:

- preserve existing ID formats
- generate IDs server-side
- use transaction-safe sequences or UUIDs for new string-key reference records
- do not expose client-selected IDs as the normal create behavior

The exact generator should be selected during implementation after checking production data conventions.

## Delete policy recommendation

Because `farms` can cascade into `scout_reports`, and crop types cascade into varieties, the safest first production behavior is:

- block destructive deletion when dependent operational data exists;
- offer an active/inactive state in a later schema phase if operational users need archival behavior.

A hard-delete button should never silently destroy historical reports.
