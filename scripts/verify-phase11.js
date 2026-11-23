"use strict";
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const checks = [];
function check(name, ok, detail = "") { checks.push({ name, ok, detail }); }
function exists(rel) { return fs.existsSync(path.join(root, rel)); }
function text(rel) { return fs.readFileSync(path.join(root, rel), "utf8"); }

check("Monitoring standard exists", exists("ops/monitoring.md"));
check("Backup/recovery runbook exists", exists("ops/backup-recovery.md"));
check("Incident response runbook exists", exists("ops/incident-response.md"));
check("Maintenance policy exists", exists("ops/maintenance-policy.md"));
check("Support handover checklist exists", exists("ops/support-handover.md"));
check("PostgreSQL backup script exists", exists("scripts/backup-postgres.sh"));
check("PostgreSQL restore script exists", exists("scripts/restore-postgres.sh"));
check("Phase 10 release candidate retained", exists("RELEASE-CANDIDATE.md"));
check("Public reference routes remain mounted", text("server/app.js").includes('app.use("/api", routes)'));
check("Health API route remains present", text("server/routes/health.routes.js").includes('router.get("/",'));
check("Request correlation remains present", text("server/middleware/logger.js").includes("x-request-id"));
check("Production HSTS remains present", text("server/middleware/securityHeaders.js").includes("Strict-Transport-Security"));
check("Authentication rate limiter remains present", exists("server/middleware/rateLimit.js"));
check("PostgreSQL compose remains present", exists("docker-compose.yml"));
check("PostgreSQL migration remains present", exists("server/migrations/init.sql"));
check("Backup script refuses missing credentials", text("scripts/backup-postgres.sh").includes('DB_PASSWORD:?DB_PASSWORD is required'));
check("Restore script requires disposable DB", text("scripts/restore-postgres.sh").includes('RESTORE_DB:?RESTORE_DB is required'));
check("Runbook forbids direct production restore", text("ops/backup-recovery.md").includes("never directly over production"));
check("Incident runbook defines rollback", text("ops/incident-response.md").includes("## Rollback"));
check("Maintenance policy defines quarterly DR", text("ops/maintenance-policy.md").includes("quarterly"));
check("Support handover covers monitoring", text("ops/support-handover.md").includes("Monitoring dashboard owner"));

let passed = 0;
for (const c of checks) {
  if (c.ok) passed++;
  console.log(`${c.ok ? "PASS" : "FAIL"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}
console.log(`\nChecks: ${checks.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${checks.length - passed}`);
process.exitCode = passed === checks.length ? 0 : 1;
