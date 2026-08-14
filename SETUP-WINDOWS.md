# Scout Report Phase 22 — Windows Setup / npm ci Fix

## Why `npm ci` failed
The ZIP is a project archive, but the project was executed from `Z:\Scout-Report\11`, which did not contain `package.json` or `package-lock.json`.

The project root is the folder containing BOTH:
- `package.json`
- `package-lock.json`
- `server\`
- `previews\`

## Recommended Git Bash commands

```bash
cd /z/Scout-Report/11/Scout-Report-Phase22-HOD-Remediation-2026-08-12
pwd
ls package.json package-lock.json
npm ci
npm run verify:auth-fix
npm run verify:hod-workflow
npm test
```

If you want the project folder to be named `11`, copy/extract the project contents into that folder first, then run the commands above from `/z/Scout-Report/11`.

## Expected package metadata
- package: `scout-report`
- version: `2.2.2`
- lockfileVersion: `3`

## Important
Do NOT run `npm install` merely to work around this error. The supplied release already contains a valid `package-lock.json`; `npm ci` is the correct clean-install command once the working directory is the project root.
