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

const requiredFiles = [
  "scripts/verify-phase16.js",
  "scripts/verify-phase17.js",
  "scripts/generate-slo-report.js",
  "scripts/generate-reliability-review.js",
  "docs/operations/PHASE17-LIVE-EVIDENCE.md",
  "docs/operations/PHASE17-LOCAL-ACCEPTANCE.md",
  "docs/operations/SLO-REPORT-TEMPLATE.md",
  "docs/operations/RELIABILITY-REVIEW-TEMPLATE.md",
  "docs/operations/INCIDENT-ACTION-REGISTER.md",
  "docs/admin-crud/50-PHASE17-START-PACK.md",
  "docs/admin-crud/51-PHASE17-COMPLETION-REPORT.md",
  "docs/admin-crud/52-PHASE18-START-PACK.md",
  "ops/continuous-improvement.md",
  "ops/slo-baseline.md",
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
  "README.md",
  "NEXT-DEV-STEP.md"
];
for (const rel of requiredFiles) check(`exists: ${rel}`, exists(rel));

check("phase17 npm script present", pkg.scripts["verify:phase17"] === "node scripts/verify-phase17.js");
check("release check is at least phase17", ["npm run verify:phase17", "npm run verify:phase18", "npm run verify:phase19"].includes(pkg.scripts["release:check"]));
check("phase16 gate remains callable", pkg.scripts["verify:phase16"] === "node scripts/verify-phase16.js");
check("SLO report generator retained", pkg.scripts["report:slo"] === "node scripts/generate-slo-report.js");
check("reliability review generator retained", pkg.scripts["review:reliability"] === "node scripts/generate-reliability-review.js");

const ci = text(".github/workflows/ci.yml");
const release = text(".github/workflows/release.yml");
const evidence = text("docs/operations/PHASE17-LIVE-EVIDENCE.md");
const local = text("docs/operations/PHASE17-LOCAL-ACCEPTANCE.md");
const completion = text("docs/admin-crud/51-PHASE17-COMPLETION-REPORT.md");
const next = text("docs/admin-crud/52-PHASE18-START-PACK.md");

check("CI runs phase gates through at least 17", ci.includes("for phase in {1..17}") || ci.includes("for phase in {1..18}") || ci.includes("for phase in {1..19}"));
check("CI uses clean npm ci", ci.includes("npm ci"));
check("CI runs full npm test", ci.includes("npm test"));
check("CI enables DB integration", ci.includes('RUN_DB_INTEGRATION: "1"'));
check("CI applies PostgreSQL schema", ci.includes("server/migrations/init.sql"));
check("CI uploads phase17 evidence path", ci.includes("phase17-evidence") || ci.includes("phase18-evidence") || ci.includes("phase19-evidence"));
check("CI builds release artifact", ci.includes("npm run release:artifact"));
check("release uses protected environment", release.includes("environment: ${{ inputs.environment }}"));
check("release gate uses the promoted release check", release.includes("npm run release:check"));
check("release captures phase17/18 evidence", release.includes("PHASE17-LIVE-EVIDENCE") || release.includes("PHASE18-LIVE-EVIDENCE") || release.includes("PHASE19-LIVE-EVIDENCE"));
check("release preserves approval boundary", release.includes("required reviewers"));

check("live evidence separates executed from pending", evidence.toLowerCase().includes("pending") && evidence.includes("## Production"));
check("local acceptance records user-supplied runtime evidence", local.includes("Passed: **67**") && local.includes("Failed: **0**") && local.includes("Skipped: **1**"));
check("local acceptance records PostgreSQL 17.10", local.includes("PostgreSQL: **17.10**"));
check("local acceptance records clean npm ci", local.includes("Packages added: **115**"));
check("completion report forbids invented production evidence", completion.toLowerCase().includes("do not invent"));
check("next phase is explicitly defined", next.includes("Phase 18"));
check("Scout public API compatibility remains explicit", completion.includes("/api/reference/*"));
check("admin metrics remains protected", text("server/routes/metrics.routes.js").includes('auth.authorizeRoles("admin")'));
check("Phase 16 remains regression gate", completion.includes("Phase 16"));

for (const rel of [
  "scripts/verify-phase16.js", "scripts/verify-phase17.js", "scripts/generate-slo-report.js",
  "scripts/generate-reliability-review.js", "server/app.js", "server/routes/index.js",
  "server/routes/metrics.routes.js", "server/metrics.js"
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
