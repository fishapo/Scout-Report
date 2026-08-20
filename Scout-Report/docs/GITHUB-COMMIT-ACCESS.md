# Scout Report — GitHub Access, Commit and Recovery Commands

## Repository

Known project repository:

`https://github.com/fishapo/Scout-Report`

Open it in a browser:

https://github.com/fishapo/Scout-Report

## First check the local Git state

From the project root:

```bash
pwd
git status
git branch --show-current
git remote -v
git log -5 --oneline
```

If these work, the folder is already a Git working tree.

## If the extracted ZIP is NOT a Git repository

The ZIP supplied for this audit contains no `.git` directory. If you want to connect this cleaned folder to the existing repository:

```bash
git init
git remote add origin https://github.com/fishapo/Scout-Report.git
git fetch origin
git branch -r
```

Do NOT immediately force-push.

If the remote uses `main`:

```bash
git checkout -b main --track origin/main
```

If Git reports that local files would be overwritten, stop and compare before merging.

## Recommended safe reconciliation

After confirming the remote branch:

```bash
git fetch origin
git status
git diff --stat origin/main
git diff --name-status origin/main
```

If the local cleaned tree is intentionally the new baseline, stage it:

```bash
git add -A
git status
```

Review the staged file list carefully.

Then commit:

```bash
git commit -m "chore: establish clean phase 29 development baseline"
```

Push:

```bash
git push -u origin main
```

## If the existing repository uses another branch

List branches:

```bash
git branch -a
```

Then use the actual branch:

```bash
git checkout -b feature/phase29-baseline
git push -u origin feature/phase29-baseline
```

Create the pull request on GitHub after CI is green.

## Daily development loop

```bash
git pull --ff-only
npm ci
npm test
git status
```

After a logical change:

```bash
git add <changed-files>
git diff --cached
git commit -m "type: concise description"
npm test
git push
```

Useful commit types:

- `fix:` bug correction
- `test:` tests/fixtures
- `refactor:` internal structure without behavior change
- `feat:` new functionality
- `docs:` documentation
- `chore:` maintenance/configuration
- `security:` security hardening

## Inspect GitHub remote

```bash
git remote get-url origin
git ls-remote origin
```

## If authentication fails

For HTTPS GitHub operations, use GitHub authentication supported by your environment. Do not put a password or personal access token directly into a Git remote URL.

If GitHub CLI is installed:

```bash
gh auth status
gh repo view fishapo/Scout-Report
```

## Clone a clean copy for verification

From a directory outside the project:

```bash
git clone https://github.com/fishapo/Scout-Report.git Scout-Report-clean
cd Scout-Report-clean
npm ci
npm test
```

This is the best way to distinguish a local working-tree problem from a repository problem.

## Emergency rollback

Before destructive Git operations:

```bash
git status
git branch backup-before-reset
```

If a pushed commit must be undone, prefer:

```bash
git revert <commit-sha>
git push
```

Avoid `git reset --hard` and `git push --force` unless you have deliberately confirmed the branch/history and have a backup.

## Never commit

- `.env`
- `.env.*` except `.env.example`
- database dumps
- passwords
- JWT secrets
- API tokens
- `node_modules`
- local backup copies
- private deployment credentials
