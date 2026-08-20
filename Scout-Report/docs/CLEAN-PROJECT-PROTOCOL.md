# Scout Report — Clean Project Protocol

## Removed from the clean package

- `node_modules/`
- `.env`
- `.env.BAD-BACKUP`
- all `*.bak` files
- nested `Scout-Report-Reviewed-2026-08-14/` duplicate snapshot
- `.git/` if present in a future source archive

## Preserved

- application source;
- tests;
- migrations;
- documentation;
- operational files;
- package-lock.json;
- spreadsheets and source reference artifacts needed by the application;
- historical phase records.

## Added

- `.env.example`
- stronger local-ignore rules;
- Phase 29 audit;
- comprehensive development process;
- GitHub command guide;
- static file/function inventory.

## Do not manually delete source files just because they look old

For suspected legacy files:

1. find all imports/references;
2. run focused tests;
3. check package scripts;
4. check browser references;
5. check documentation;
6. only then remove or archive;
7. run the full suite.

## Cleanup command

A portable audit/cleanup helper is provided under:

`scripts/audit-project.js`

For Windows PowerShell, use:

`scripts/clean-project.ps1`

The cleanup script is designed to remove local generated artifacts, not application source.
