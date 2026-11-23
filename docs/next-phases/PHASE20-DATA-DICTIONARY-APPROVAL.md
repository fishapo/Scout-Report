# Phase 20 — Data Dictionary Approval Record

**Status:** APPROVED FOR PHASE 21 IMPLEMENTATION
**Date:** 11 August 2026

## Scope

Phase 20 freezes the canonical data contract before database expansion. It does **not** alter the production schema. Existing four-role verification remains unchanged.

## Source inventory

Four concrete source structures are represented in the supplied package: the current flat Scout Report exchange, a repeated survey-stop scouting structure, a digital scouting structure, and a Kenya-oriented IPM/surveillance structure. A generic wide legacy adapter is retained for future controlled mapping.

## Mapping decision

All observed source fields are either mapped to a canonical field, retained as narrative/provenance, or explicitly marked conditional. No source workflow status is trusted as approval.

## Canonical domains approved

1. Identity and visit
2. Location and mapping
3. Crop and phenology
4. Weather and microclimate
5. Soil and water
6. Crop health
7. Weeds
8. Pests and beneficial organisms
9. Diseases and symptoms
10. Management and recommendations
11. Evidence/media
12. Samples/diagnostics
13. Import provenance
14. Verification/governance

## Required baseline fields

`farmId`, `farmName`, `cropType`, and `reportDate` remain the minimum canonical identity required for an import row. Other fields become required by context in later form/schema validation.

## Units and controlled values

Where the source unit is unknown, the mapping is marked for business confirmation instead of silently converting. Controlled vocabularies are deliberately deferred to the Phase 21/22 reference-data design.

## Approval gate

The Phase 21 implementer must treat `field-dictionary.json` and `field-mapping-matrix.csv` as the versioned contract. Changes after this point require a dictionary version increment and regression fixtures.
