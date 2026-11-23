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
  "scripts/verify-phase15.js",
  "scripts/verify-phase16.js",
  "scripts/generate-slo-report.js",
  "scripts/generate-reliability-review.js",
  "docs/operations/PHASE16-LIVE-EVIDENCE.md",
  "docs/operations/SLO-REPORT-TEMPLATE.md",
  "docs/operations/RELIABILITY-REVIEW-TEMPLATE.md",
  "docs/operations/INCIDENT-ACTION-REGISTER.md",
  "docs/admin-crud/47-PHASE16-START-PACK.md",
  "docs/admin-crud/48-PHASE16-COMPLETION-REPORT.md",
  "docs/admin-crud/49-PHASE17-START-PACK.md",
  "ops/continuous-improvement.md",
  "ops/slo-baseline.md",
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml"
]) check(`exists: ${rel}`, exists(rel));

check("phase16 npm script present", pkg.scripts["verify:phase16"] === "node scripts/verify-phase16.js");
check("release check is at least phase16", ["npm run verify:phase16", "npm run verify:phase17", "npm run verify:phase18", "npm run verify:phase19"].includes(pkg.scripts["release:check"]));
check("SLO report script present", pkg.scripts["report:slo"] === "node scripts/generate-slo-report.js");
check("reliability review script present", pkg.scripts["review:reliability"] === "node scripts/generate-reliability-review.js");

const ci = text(".github/workflows/ci.yml");
const release = text(".github/workflows/release.yml");
const ciOps = ci.toLowerCase();
check("CI runs phase gates through at least 16", ci.includes("for phase in {1..16}") || ci.includes("for phase in {1..17}") || ci.includes("for phase in {1..18}") || ci.includes("for phase in {1..19}"));
check("SLO report generation script is available", pkg.scripts["report:slo"] === "node scripts/generate-slo-report.js");
check("CI uploads phase evidence", ci.includes("phase16-evidence") || ci.includes("phase17-evidence") || ci.includes("phase18-evidence") || ci.includes("phase19-evidence"));
check("release captures current phase evidence", release.includes("PHASE16-LIVE-EVIDENCE") || release.includes("PHASE17-LIVE-EVIDENCE") || release.includes("PHASE18-LIVE-EVIDENCE") || release.includes("PHASE19-LIVE-EVIDENCE"));
check("release runs phase16 release gate", release.includes("npm run release:check"));
check("release preserves protected environment", release.includes("environment: ${{ inputs.environment }}"));
check("release has production approval boundary", release.includes("required reviewers"));
check("CI retains PostgreSQL service", ci.includes("postgres:16-alpine"));
check("CI retains clean npm ci", ci.includes("npm ci"));
check("CI retains full npm test", ci.includes("npm test"));
check("CI retains DB integration", ci.includes("RUN_DB_INTEGRATION"));
check("CI retains release artifact", ci.includes("npm run release:artifact"));
check("CI creates phase evidence directory", ci.includes("phase16-evidence") || ci.includes("phase17-evidence") || ci.includes("phase18-evidence") || ci.includes("phase19-evidence"));
check("continuous improvement defines SLO review cadence", text("ops/continuous-improvement.md").includes("7-day"));
check("continuous improvement defines 30-day review", text("ops/continuous-improvement.md").includes("30-day"));
check("SLO template prevents invented measurements", text("docs/operations/SLO-REPORT-TEMPLATE.md").toLowerCase().includes("do not invent"));
check("SLO template has availability", text("docs/operations/SLO-REPORT-TEMPLATE.md").includes("Availability"));
check("SLO template has latency", text("docs/operations/SLO-REPORT-TEMPLATE.md").toLowerCase().includes("latency"));
check("SLO template has 5xx", text("docs/operations/SLO-REPORT-TEMPLATE.md").includes("5xx"));
check("reliability review has incidents", text("docs/operations/RELIABILITY-REVIEW-TEMPLATE.md").includes("Incidents"));
check("reliability review has deployment metrics", text("docs/operations/RELIABILITY-REVIEW-TEMPLATE.md").includes("Deployment"));
check("incident register has owner", text("docs/operations/INCIDENT-ACTION-REGISTER.md").includes("Owner"));
check("incident register has due date", text("docs/operations/INCIDENT-ACTION-REGISTER.md").includes("Due"));
check("live evidence has measured-data boundary", text("docs/operations/PHASE16-LIVE-EVIDENCE.md").toLowerCase().includes("not executed"));
check("Scout reference API compatibility remains explicit", text("docs/operations/PHASE16-LIVE-EVIDENCE.md").includes("/api/reference"));
check("admin metrics remains protected", text("server/routes/metrics.routes.js").includes('auth.authorizeRoles("admin")'));

for (const rel of [
  "scripts/verify-phase16.js", "scripts/generate-slo-report.js", "scripts/generate-reliability-review.js",
  "server/app.js", "server/routes/index.js", "server/routes/metrics.routes.js", "server/metrics.js"
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
