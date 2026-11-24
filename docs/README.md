# Documentation Index

## Authoritative documentation

- `../PROJECT_DOCUMENTATION.md` is the editable master source.
- `Scout-Report-Master-Documentation.docx` is the compiled distribution document.
- `RELEASE-RUNBOOK.md` is the concise release command reference.
- `workflow/README.md` contains focused workflow background.
- `XLSX-FORMAT.md` contains the legacy exchange-format note.

## Historical records

The remaining phase, rebase, verification, acceptance, and operations documents preserve implementation history and evidence. They are not independent statements of the current product. If a historical record conflicts with the master document or current source code, follow the current source code and `PROJECT_DOCUMENTATION.md`.

## Updating documentation

Update `PROJECT_DOCUMENTATION.md`, run `python scripts/build_project_documentation.py`, render and inspect the generated Word document, and commit the source and compiled copy together.
