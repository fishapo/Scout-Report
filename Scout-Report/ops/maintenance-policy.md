# Maintenance & Dependency Policy

## Monthly
- Review npm dependencies and security advisories.
- Review PostgreSQL backups and perform a restore drill according to the quarterly schedule.
- Review logs, disk usage, failed authentication and 5xx trends.

## Quarterly
- Full disaster-recovery restore test.
- Review Node.js LTS support status.
- Review PostgreSQL version/support status.
- Review secrets, access and admin accounts.
- Review SLO/KPI targets.

## Change control
Every production change requires: purpose, risk, test evidence, rollback plan, owner and release identifier.

## Dependency updates
Use `npm ci` from a clean checkout before release testing. Update dependencies deliberately, regenerate the lockfile with the project-approved npm version, run all verification gates, then record the change in release notes.
