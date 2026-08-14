# 9. Test and Regression Plan

## Test layers

### A. Repository/store tests

Test:

- create
- list
- get
- update
- delete
- duplicate handling
- invalid input
- missing parent
- dependency conflicts

### B. Route/controller integration tests

For every endpoint verify:

- status
- response shape
- validation
- error behavior
- authentication
- authorization

### C. Existing application regression tests

Run the existing project suite after every CRUD phase.

## Security matrix

| Actor | Read admin CRUD | Create | Update | Delete |
|---|---:|---:|---:|---:|
| anonymous | 401 | 401 | 401 | 401 |
| scout | 403 | 403 | 403 | 403 |
| admin | 200 | 201 | 200 | 204/200 |

## Farm test matrix

- create valid farm
- empty name
- whitespace-only name
- duplicate name
- missing farm
- update valid farm
- update to duplicate
- delete unused farm
- delete farm referenced by report
- existing scout read API sees new farm

## Crop type matrix

Same basic CRUD matrix plus:

- crop type with varieties
- crop deletion with varieties
- read API preserves variety nesting

## Variety matrix

- create under existing crop
- create under missing crop
- duplicate under same crop
- same name under different crop according to DB constraint
- update
- delete
- parent mismatch
- existing scout read endpoint sees changes

## Pest matrix

- create
- duplicate
- update
- delete
- description validation
- historical observation behavior after rename/delete

## Disease matrix

Same as pests.

## Read API regression

After each admin mutation:

```text
GET /api/reference/farms
GET /api/reference/crop-types
GET /api/reference/crop-types/:id/varieties
GET /api/reference/pests
GET /api/reference/diseases
```

must still return their established shapes.

## Scout form regression

Verify:

- farm select populates
- crop select populates
- variety changes with crop
- pest selects populate
- disease selects populate
- report submission still validates against references

## Report regression

Verify:

- creating a report with a current reference succeeds
- invalid reference still fails
- historical reports remain readable
- admin report dashboard remains functional

## UI tests

Add deterministic checks for:

- admin-only controls
- modal/form presence
- API endpoint wiring
- success/error states

## Performance tests

Only after correctness:

- measure reference load latency
- measure CRUD latency
- inspect SQL
- check connection pool behavior
- determine whether caching is justified
