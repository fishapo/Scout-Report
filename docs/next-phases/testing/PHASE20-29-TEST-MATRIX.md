# Phase 20–29 Test Matrix

| Phase | Minimum tests |
|---|---|
| 20 | mapping fixtures, required-field matrix, unit conversions |
| 21 | migration, FK, check constraints, transaction rollback |
| 22 | form payload contract, conditional fields, repeatable observations |
| 23 | adapter fixtures, header aliases, date/percent/boolean normalization, duplicate detection, dry-run |
| 24 | CRUD + ownership + analytics aggregation per observation domain |
| 25 | media metadata, sample lifecycle, authorization |
| 26 | checklist completeness, role/stage enforcement, audit event creation |
| 27 | analytics totals vs source SQL, filters, performance |
| 28 | offline queue, retry, duplicate sync, conflict resolution |
| 29 | clean install, staging smoke, backup/restore, rollback, production smoke |

**Rule:** negative-path errors printed during tests are acceptable only when the corresponding assertion passes. Pending infrastructure evidence is never treated as PASS.
