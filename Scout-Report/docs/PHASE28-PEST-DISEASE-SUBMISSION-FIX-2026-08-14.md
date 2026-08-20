# Scout Report — Phase 28 Form Pest/Disease Submission Fix
**Date:** 2026-08-14

## 1. Problem observed

The browser form displayed a valid pest reference selection (for example `Aphid`) but report submission could fail with:

`Valid pest type is required`

The failure was caused by a contract mismatch between the spreadsheet-derived master observation labels used by `previews/user-form.html` and the authoritative PostgreSQL reference rows used by `server/store.js`.

The form previously generated observations such as:

```json
{"pestType":"Caterpillar","count":12}
```

while the master reference migration contains `Cater Pillar`. Similar differences exist for several pest and disease labels.

## 2. Root cause

`server/store.js` intentionally validates every submitted observation through the live `pests` and `diseases` tables.

Before Phase 28, the browser generated `pestType` and `diseaseType` from hard-coded spreadsheet labels. The visible reference dropdowns were loaded from the API, but those live IDs were not used when constructing the observation arrays.

This created two separate reference contracts:

1. UI dropdown reference values.
2. Master observation submission labels.

They could diverge even though both originated from the same business reference data.

## 3. Refactor and fix

### New browser reference resolver

Added:

`previews/js/reference-mapping.js`

Responsibilities:

- normalize reference labels for comparison;
- resolve exact names first;
- resolve spacing/case/punctuation differences;
- resolve controlled singular/plural differences;
- accept explicit aliases for known master-spreadsheet naming differences;
- return the authoritative live reference ID.

### Updated form state

`previews/user-form.html` now maintains:

- `referencePests`
- `referenceDiseases`

These are populated directly from:

- `/api/reference/pests`
- `/api/reference/diseases`

### Updated pest submission

Each populated master pest column is resolved to a live pest ID before submission.

Known mappings include:

| Master label | Reference variation handled |
|---|---|
| Caterpillar | Cater Pillar |
| Butterflies | Butter Flies |
| Nematodes | Nema Todes |
| White Fly | Whitefly through normalized comparison |
| Aphids | Aphids / Aphid through normalized comparison |

### Updated disease submission

Known mappings include:

| Master label | Reference variation handled |
|---|---|
| Chlorosis | Chlo Rosis Spots/Mp |
| Rhizoctonia | Rhyzoc Tonia |
| Botrytis | Botrytis Spots/Mp |
| Powdery mildew | Powdery Mildew |
| Leafspot Black | Leafspot Black |
| Leafspot Brown | Leafspot Brown |

The submitted payload therefore uses:

```json
{
  "pestType": "<live-reference-id>"
}
```

or:

```json
{
  "diseaseType": "<live-reference-id>"
}
```

The backend already accepts reference IDs through its existing `id = $1 OR name = $1` resolution contract.

## 4. Why this fixes the browser error

The old flow was:

`master column -> display label -> PostgreSQL name lookup`

The new flow is:

`master column -> live reference resolver -> PostgreSQL reference ID -> report store`

This removes dependency on exact spelling of the display label.

The visible `Pest Type Reference` dropdown is still retained for operator reference. The actual observation records are derived from the populated master observation columns, so selecting a header reference does not silently replace the individual observation data.

## 5. Validation behavior

If an operator enters a value into a pest/disease master observation column and the corresponding live reference cannot be resolved, the browser now stops before the POST and reports the exact master column and label requiring configuration.

This is preferable to a generic server message such as:

`Valid pest type is required`

because the operator can identify the missing reference immediately.

## 6. Tests added

`previews/master-reference.test.js` now verifies:

1. the 130-crop master catalog;
2. spreadsheet crop/variety integrity;
3. active greenhouse field behavior;
4. separate disease/stress references;
5. save action naming;
6. pest spelling/spacing reference resolution;
7. disease master-name resolution;
8. form integration with the live reference resolver.

Focused test command:

```bash
node --test previews/master-reference.test.js
```

Result on 2026-08-14:

`8 tests passed`

The form's inline JavaScript was also syntax-checked with Node and passed.

## 7. Full-suite status

The uploaded project did not contain `node_modules`.

Running:

```bash
npm test
```

therefore stops in the dependency verification step and reports missing:

- express
- dotenv
- pg
- cookie-parser
- cors

Install dependencies with:

```bash
npm ci
```

Then run:

```bash
npm test
```

No production dependency was removed or replaced by this fix.

## 8. Database requirement

The project still expects the Phase 22/23 master reference migration to be applied:

```bash
npm run migrate
```

The live database should contain the authoritative pest and disease rows from:

`server/migrations/007_master_reference_data.sql`

## 9. Files changed in Phase 28

- `previews/user-form.html`
- `previews/js/reference-mapping.js`
- `previews/master-reference.test.js`
- `README.md`
- `docs/PHASE28-PEST-DISEASE-SUBMISSION-FIX-2026-08-14.md`
- `PHASE28-COMPLETE.txt`

## 10. Operator verification

1. Start PostgreSQL.
2. Run `npm ci`.
3. Run `npm run migrate`.
4. Start the application.
5. Log in.
6. Open `/scout-form`.
7. Select the farm, crop and variety.
8. Enter a value in one or more pest master observation fields.
9. Enter a value in one or more disease master observation fields.
10. Click **Save & Submit Report**.
11. Confirm no `Valid pest type is required` or equivalent reference mismatch appears.
12. Confirm the report ID is displayed in the form status.
13. Retrieve the saved report and confirm the observation types are stored.

## 11. Release assessment

**Phase 28 implementation:** complete.

**Focused browser/reference tests:** passed.

**Full npm suite:** not executed to completion because the supplied ZIP intentionally/actually lacks installed npm dependencies.

**Database integration:** requires the target PostgreSQL instance and migration state.

