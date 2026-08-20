# PostgreSQL Backup & Recovery Runbook

## Backup
Use a dedicated backup directory outside the application repository.

```bash
mkdir -p backups
pg_dump --format=custom --no-owner --no-acl \
  --dbname="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" \
  > backups/scout_report_$(date +%Y%m%d_%H%M%S).dump
```

Never commit dumps or credentials.

## Restore drill
Restore into a disposable database, never directly over production:

```bash
createdb scout_report_restore
pg_restore --clean --if-exists --no-owner \
  --dbname=scout_report_restore backups/<backup>.dump
```

Run the schema/data smoke checks after restore, then remove the disposable database.

## Recovery objectives
- RPO target: 24 hours unless business requirements specify a tighter window.
- RTO target: 2 hours for the documented baseline deployment.
- Retain at least one recent off-host backup and periodically test restoration.

## Failure handling
1. Declare incident and record timestamp.
2. Preserve request IDs and logs.
3. Stop destructive maintenance.
4. Restore to an isolated database first.
5. Validate schema and critical reference data.
6. Switch service only after verification.
7. Record a post-incident review.
