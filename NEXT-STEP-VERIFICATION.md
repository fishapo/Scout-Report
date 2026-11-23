# Next Step — collect → inventory → map → approve → code

1. **Collect** — run the master workbook import against a copy/staging database.
2. **Inventory** — record counts of farms, crop types, varieties, pests and diseases.
3. **Map** — confirm every imported source heading maps to a canonical application key.
4. **Approve** — verify the farm list and spreadsheet crop/variety catalogue with the business owner.
5. **Code** — only after approval, promote the reference dataset to the production database.

Do not wipe the existing database merely to make migration pass. The corrected migration is intended to be safe against existing reference records.
