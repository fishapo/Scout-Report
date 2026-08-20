# 8. Database Migration and Data Safety Strategy

## First rule

Do not alter the schema merely to make CRUD possible.

The current schema already supports the basic CRUD operations.

Schema changes should only be introduced where a real data-safety or product requirement exists.

## Immediate schema concerns

### Farm deletion

Current:

`scout_reports.farm_id → farms.id ON DELETE CASCADE`

This means deleting a farm can delete reports.

This must be addressed before exposing a normal admin delete operation.

### Crop deletion

Current:

`crop_varieties.crop_type_id → crop_types.id ON DELETE CASCADE`

Deleting a crop type deletes its varieties.

The UI must communicate this or the server must block it.

### Pest/disease historical strings

Observation tables store names instead of foreign keys.

Renaming reference records therefore does not automatically rename historical observations.

## Recommended first release deletion policy

Use a server-side dependency check.

If the record has historical/operational dependencies:

- reject deletion with 409
- explain why

For example:

```json
{
  "success": false,
  "error": {
    "code": "REFERENCE_IN_USE",
    "message": "This farm is used by existing scout reports and cannot be deleted."
  }
}
```

## Future archival model

A later migration can introduce:

```text
is_active BOOLEAN NOT NULL DEFAULT TRUE
```

or:

```text
deleted_at TIMESTAMP NULL
```

Then the public read API can return only active references while historical reports continue to resolve.

This should be a separate schema decision, not an accidental side effect of CRUD implementation.

## ID generation

Current string IDs are stable and human-readable.

New records should receive IDs on the server.

Possible options:

1. sequence-backed prefixes
2. UUIDs
3. dedicated counters

Prefer consistency with existing production data over theoretical elegance.

## Migration discipline

If schema changes become necessary:

1. create numbered migration
2. make it idempotent where practical
3. run against test DB
4. run regression suite
5. verify seed behavior
6. document rollback strategy
7. only then expose UI requiring the schema

## Backup

Before production schema changes:

- database backup
- migration dry run
- restore test if the environment supports it
