# Phase 23 — Spreadsheet → Scout Report Form Alignment

## Verification basis

The source workbook used for this release is `Copy of Combined Scout Report Master ver_21-2026(1).xlsx`. Its `Clean Data` worksheet contains **31,890 rows including the header** and **38 columns**. The first-row headings match the Phase 22 master-import schema **exactly, in order**.

## Exact 38 source headings

1. WEEK
2. Farm
3. GH
4. Inpl. wk-year
5. Crop
6. Variety
7. Thrips_Larvae
8. Thrips_adults
9. LEAF MINER_feeding point
10. LEAF MINER_complete mines
11. White fly_eggs
12. White fly_adult
13. Aphids_nymphs
14. Aphids_adult
15. Spider mite_eggs
16. Spider mite_adults
17. Beetles_countimg
18. Cater pillar_spots
19. Butter-flies_counting
20. Sciara fly_spots
21. Cut worms_counting
22. Mealy bugs_spots
23. Slugs_counting
24. Snails_counting
25. Nema- todes_spots
26. Chlo- rosis_spots/MP
27. Fusarium_MP
28. Rhyzoc tonia_MP
29. Powdery mildew_MP
30. Botrytis_spots/MP
31. Leafspot_Black
32. Leafspot_Brown
33. Flower buds_Cuttings
34. Chem. Damage_MP
35. Virus doubt_MP
36. Mix_MP
37. Dry spots_Bags/spots
38. Others

## Canonical contract

The application retains the approved **93-field canonical dictionary**. The 38 master fields are treated as source-format fields and preserved in `scout_reports.master_observations`; canonical visit/environment/crop fields are stored in their dedicated PostgreSQL columns and expanded observation tables.

## Form changes

The Scout Report form now follows the spreadsheet order: master header → environment/location → crop/stand → pest columns → disease/symptom columns → stress/other columns → management/evidence. Existing GPS/location capture is retained.

Farm choices are explicitly aligned to: `FARM 1` through `FARM 11`, `FARM 12A`, and `FARM 12B` (13 farm choices). `GREENHOUSE` is a location mode, not a farm choice. Location mode buttons are `Field`, `Greenhouse`, and `Shadenet`.

Crop types and varieties are sourced from the workbook `Names` sheet and seeded into PostgreSQL. The browser loads crop types together with their nested varieties and uses that already-loaded reference data for the dependent Crop → Variety selector; Variety remains disabled until a Crop is selected. Spreadsheet pest/disease categories are also seeded as controlled reference values.

## Import/export

The master import continues to stage and validate the `Clean Data` worksheet before production creation. XLSX export now uses the same 38 master headings, so form-created records and spreadsheet exchange share the same source contract.

## End-to-end save

A form submission stores the selected farm/crop/variety, canonical header fields, GPS/location data, environmental values, legacy pest/disease observations, and the complete entered 38-column master observation object. Additional canonical crop/weather/soil/irrigation/survey-stop records are created where values were supplied.

## Verification

- Workbook heading count: **38/38**
- Workbook headings vs schema: **exact match**
- Canonical dictionary: **93/93 fields**
- Form master-key coverage: **38/38**
- Required farm choices: **13/13**
- Location modes: **3/3**
- Environment/GPS controls: **present**
- Alignment regression tests: **5/5 PASS**

## Operational note

The operator environment should run `npm ci`, database migrations, and the full `npm test` / `RUN_DB_INTEGRATION=1 npm test` suite on the delivered build. The attached operator evidence supplied for the previous Phase 22 build already showed 104 passing tests with PostgreSQL integration enabled; this release adds the Phase 23 alignment regression and source-reference migration.
