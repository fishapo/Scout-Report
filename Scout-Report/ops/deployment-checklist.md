# Production Deployment Checklist

## Pre-deployment
- [ ] CI is green on the exact commit.
- [ ] `npm ci` succeeded.
- [ ] Full test suite is green.
- [ ] PostgreSQL integration test is green.
- [ ] Release ZIP and SHA-256 checksum are recorded.
- [ ] Database backup completed and verified.
- [ ] Rollback candidate is identified.
- [ ] GitHub production Environment approval is available.

## Staging
- [ ] Deployment completed.
- [ ] `/api/health` is healthy.
- [ ] `/api/reference/farms` response contract is unchanged.
- [ ] Admin metrics requires authentication and admin authorization.
- [ ] `x-request-id` is present.
- [ ] Scout Form browser regression passed.
- [ ] Admin Dashboard browser regression passed.
- [ ] Observability alerts are receiving signals.

## Production
- [ ] Protected approval completed.
- [ ] Deployment completed.
- [ ] `/api/health` healthy.
- [ ] Reference API smoke test passed.
- [ ] Admin metrics smoke test passed.
- [ ] Error rate and latency are within SLO starting targets.
- [ ] No unexpected authentication throttling.
- [ ] Release evidence archived.

## Post-deployment
- [ ] 15-minute observation completed.
- [ ] 1-hour observation completed.
- [ ] Backup freshness confirmed.
- [ ] Rollback remains executable.
- [ ] Release review scheduled.
