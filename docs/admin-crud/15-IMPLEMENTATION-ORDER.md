# 15. Recommended Implementation Order

## Why this order

The project already works end-to-end for reference reads and report creation. The implementation should therefore minimize the blast radius.

### 1. Authorization foundation

Prove that:

- anonymous = 401
- scout = 403
- admin = allowed

Do this before any write endpoint.

### 2. Farm CRUD

Farm is the highest-risk entity because reports directly reference farms.

Implement the dependency-safe deletion policy first.

### 3. Crop type CRUD

Then address crop type/variety hierarchy.

### 4. Variety CRUD

This validates the parent-child CRUD pattern.

### 5. Pest CRUD

Straightforward reference CRUD, with historical string behavior documented.

### 6. Disease CRUD

Repeat the proven pest pattern.

### 7. Admin UI

Only build the complete UI after the API contract has stabilized.

### 8. Regression

Run the scout form and all existing tests.

### 9. Audit trail

Add administrative accountability.

### 10. Performance

Profile and optimize only after correctness.

## Commit discipline

Prefer small, reversible commits:

1. `feat: add admin reference api foundation`
2. `feat: add admin farm crud`
3. `feat: add admin crop type crud`
4. `feat: add admin crop variety crud`
5. `feat: add admin pest crud`
6. `feat: add admin disease crud`
7. `feat: add admin reference management ui`
8. `test: add admin reference crud regression suite`
9. `feat: add reference data audit logging`
10. `perf: optimize reference data loading`
