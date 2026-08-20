"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const root = path.resolve(__dirname, "..");
const checks = [];
const check = (name, ok) => checks.push({ name, ok: !!ok });
const exists = rel => fs.existsSync(path.join(root, rel));
const text = rel => fs.readFileSync(path.join(root, rel), "utf8");
const pkg = JSON.parse(text("package.json"));

for (const rel of [
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
  ".github/dependabot.yml",
  "scripts/verify-phase14.js",
  "scripts/verify-phase15.js",
  "scripts/staging-smoke.sh",
  "scripts/backup-postgres.sh",
  "scripts/restore-postgres.sh",
  "scripts/build-release-artifact.sh",
  "ops/slo-baseline.md",
  "ops/deployment-checklist.md",
  "ops/rollback-runbook.md",
  "docs/operations/PHASE14-LIVE-EVIDENCE.md",
  "docs/operations/PHASE15-LIVE-EVIDENCE.md",
  "docs/admin-crud/45-PHASE15-START-PACK.md",
  "docs/admin-crud/46-PHASE15-COMPLETION-REPORT.md",
  "docs/admin-crud/47-PHASE16-START-PACK.md"
]) check(`exists: ${rel}`, exists(rel));

check("phase15 npm script present", pkg.scripts["verify:phase15"] === "node scripts/verify-phase15.js");
check("release check points to phase15", pkg.scripts["release:check"] === "npm run verify:phase15");
const ci = text(".github/workflows/ci.yml");
const release = text(".github/workflows/release.yml");
check("CI provisions PostgreSQL 16", ci.includes("postgres:16-alpine"));
check("CI uses clean install", ci.includes("npm ci"));
check("CI runs phase gates through 15", ci.includes("for phase in {1..15}"));
check("CI runs full test suite", ci.includes("npm test"));
check("CI runs DB integration", ci.includes("RUN_DB_INTEGRATION"));
check("CI builds release artifact", ci.includes("npm run release:artifact"));
check("release workflow has protected environment", release.includes("environment: ${{ inputs.environment }}"));
check("release workflow runs release gate", release.includes("npm run release:check"));
check("release workflow has approval boundary", release.includes("required reviewers"));
check("release workflow can run staging smoke", release.includes("npm run smoke:staging"));
check("release workflow captures live evidence", release.includes("PHASE15-LIVE-EVIDENCE"));
check("SLO baseline defines availability", text("ops/slo-baseline.md").includes("Availability"));
check("deployment checklist requires health verification", text("ops/deployment-checklist.md").includes("/api/health"));
check("deployment checklist requires reference regression", text("ops/deployment-checklist.md").includes("/api/reference/farms"));
check("rollback runbook requires smoke test", text("ops/rollback-runbook.md").toLowerCase().includes("smoke"));
check("live evidence defines production gates", text("docs/operations/PHASE15-LIVE-EVIDENCE.md").includes("Production"));
check("live evidence has SLO evidence", text("docs/operations/PHASE15-LIVE-EVIDENCE.md").includes("7 days"));
check("live evidence has DR evidence", text("docs/operations/PHASE15-LIVE-EVIDENCE.md").toLowerCase().includes("backup"));
check("public reference route remains mounted", text("server/app.js").includes('app.use("/api", routes)'));
check("admin metrics remains protected", text("server/routes/metrics.routes.js").includes('auth.authorizeRoles("admin")'));
check("release artifact excludes .env", text("scripts/build-release-artifact.sh").includes("./.env"));
check("release artifact creates checksum", text("scripts/build-release-artifact.sh").includes("sha256sum"));

for (const rel of [
  "scripts/verify-phase15.js", "scripts/verify-phase14.js", "server/app.js", "server/routes/index.js",
  "server/routes/metrics.routes.js", "server/metrics.js", "server/integration.runtime.test.js"
]) {
  try { execFileSync(process.execPath, ["--check", path.join(root, rel)], { stdio: "ignore" }); check(`syntax: ${rel}`, true); }
  catch { check(`syntax: ${rel}`, false); }
}
for (const rel of ["scripts/staging-smoke.sh", "scripts/backup-postgres.sh", "scripts/restore-postgres.sh", "scripts/build-release-artifact.sh"]) {
  try { execFileSync("bash", ["-n", path.join(root, rel)], { stdio: "ignore" }); check(`shell syntax: ${rel}`, true); }
  catch { check(`shell syntax: ${rel}`, false); }
}

const failed = checks.filter(c => !c.ok);
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} | ${c.name}`);
console.log(`\nChecks: ${checks.length}`);
console.log(`Passed: ${checks.length - failed.length}`);
console.log(`Failed: ${failed.length}`);
process.exitCode = failed.length ? 1 : 0;
