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
  "scripts/verify-phase17.js",
  "scripts/verify-phase18.js",
  "scripts/staging-smoke.sh",
  "scripts/backup-postgres.sh",
  "scripts/restore-postgres.sh",
  "scripts/build-release-artifact.sh",
  "scripts/generate-slo-report.js",
  "scripts/generate-reliability-review.js",
  "docs/operations/PHASE18-LIVE-EVIDENCE.md",
  "docs/operations/PHASE18-LOCAL-ACCEPTANCE-2026-08-10.md",
  "docs/operations/PHASE18-RELEASE-RUNBOOK.md",
  "docs/operations/PHASE18-DR-ROLLBACK-RECORD.md",
  "docs/admin-crud/54-PHASE18-COMPLETION-REPORT.md",
  "docs/admin-crud/55-PHASE19-START-PACK.md",
  "ops/slo-baseline.md",
  "ops/continuous-improvement.md",
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
  "README.md",
  "NEXT-DEV-STEP.md"
];
for (const rel of requiredFiles) check(`exists: ${rel}`, exists(rel));

check("phase17 npm script retained", pkg.scripts["verify:phase17"] === "node scripts/verify-phase17.js");
check("phase18 npm script present", pkg.scripts["verify:phase18"] === "node scripts/verify-phase18.js");
check("local phase18 verifier present", pkg.scripts["verify:phase18:local"] === "node scripts/verify-phase18.js --local");
check("release check points to phase18", ["npm run verify:phase18", "npm run verify:phase19"].includes(pkg.scripts["release:check"]));
check("phase16 gate remains callable", pkg.scripts["verify:phase16"] === "node scripts/verify-phase16.js");
check("SLO report generator retained", pkg.scripts["report:slo"] === "node scripts/generate-slo-report.js");
check("reliability review generator retained", pkg.scripts["review:reliability"] === "node scripts/generate-reliability-review.js");

const ci = text(".github/workflows/ci.yml");
const release = text(".github/workflows/release.yml");
const smoke = text("scripts/staging-smoke.sh");
const evidence = text("docs/operations/PHASE18-LIVE-EVIDENCE.md");
const local = text("docs/operations/PHASE18-LOCAL-ACCEPTANCE-2026-08-10.md");
const completion = text("docs/admin-crud/54-PHASE18-COMPLETION-REPORT.md");
const next = text("docs/admin-crud/55-PHASE19-START-PACK.md");

check("CI runs phase gates through 18", ci.includes("for phase in {1..18}") || ci.includes("for phase in {1..19}"));
check("CI uses clean npm ci", ci.includes("npm ci"));
check("CI runs full npm test", ci.includes("npm test"));
check("CI enables DB integration", ci.includes('RUN_DB_INTEGRATION: "1"'));
check("CI applies PostgreSQL schema", ci.includes("server/migrations/init.sql"));
check("CI uploads phase18 evidence", ci.includes("phase18-evidence") || ci.includes("phase19-evidence"));
check("CI builds release artifact", ci.includes("npm run release:artifact"));
check("CI validates artifact checksum", ci.includes("sha256sum -c"));
check("release uses protected environment", release.includes("environment: ${{ inputs.environment }}"));
check("release gate is phase18", release.includes("npm run release:check"));
check("release runs staging smoke", release.includes("npm run smoke:staging"));
check("release captures phase18 evidence", release.includes("PHASE18-LIVE-EVIDENCE") || release.includes("PHASE19-LIVE-EVIDENCE"));
check("release preserves approval boundary", release.includes("required reviewers"));
check("release does not silently certify production", release.toLowerCase().includes("approval boundary"));

check("smoke checks health", smoke.includes("/api/health"));
check("smoke checks public reference API", smoke.includes("/api/reference/farms"));
check("smoke checks login page", smoke.includes("/login"));
check("smoke checks root page", smoke.includes("status_code \"$BASE_URL/\""));
check("smoke checks protected dashboard", smoke.includes("/dashboard"));
check("smoke checks protected admin metrics", smoke.includes("/api/admin/metrics"));
check("smoke checks request correlation", smoke.includes("x-request-id"));

check("evidence keeps external fields pending until executed", evidence.toLowerCase().includes("pending") && evidence.toLowerCase().includes("not a pass"));
check("local acceptance identifies localhost runtime", local.includes("localhost:3003"));
check("local acceptance records authenticated login", local.includes("POST /auth/login") && local.includes("200"));
check("local acceptance records admin dashboard", local.includes("/admin-dashboard.html") && local.includes("200"));
check("local acceptance records protected metrics", local.includes("/api/reports/stats") && local.includes("200"));
check("completion report forbids invented external evidence", completion.toLowerCase().includes("do not invent"));
check("completion report distinguishes engineering from external gate", completion.includes("external infrastructure"));
check("next phase explicitly defined", next.includes("Phase 19"));
check("Scout public API compatibility remains explicit", completion.includes("/api/reference/*"));
check("admin namespace remains separate", completion.includes("/api/admin/reference/*"));
check("admin metrics remains protected", text("server/routes/metrics.routes.js").includes('auth.authorizeRoles("admin")'));
check("backup script is retained", exists("scripts/backup-postgres.sh"));
check("restore script is retained", exists("scripts/restore-postgres.sh"));
check("rollback is an explicit gate", completion.toLowerCase().includes("rollback"));

for (const rel of [
  "scripts/verify-phase16.js", "scripts/verify-phase17.js", "scripts/verify-phase18.js",
  "scripts/generate-slo-report.js", "scripts/generate-reliability-review.js",
  "server/app.js", "server/routes/index.js", "server/routes/metrics.routes.js", "server/metrics.js"
]) {
  try {
    execFileSync(process.execPath, ["--check", path.join(root, rel)], { stdio: "ignore" });
    check(`syntax: ${rel}`, true);
  } catch { check(`syntax: ${rel}`, false); }
}
for (const rel of ["scripts/staging-smoke.sh", "scripts/backup-postgres.sh", "scripts/restore-postgres.sh", "scripts/build-release-artifact.sh"]) {
  try {
    execFileSync("bash", ["-n", path.join(root, rel)], { stdio: "ignore" });
    check(`shell syntax: ${rel}`, true);
  } catch { check(`shell syntax: ${rel}`, false); }
}

const failed = checks.filter(c => !c.ok);
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} | ${c.name}`);
console.log(`\nChecks: ${checks.length}`);
console.log(`Passed: ${checks.length - failed.length}`);
console.log(`Failed: ${failed.length}`);
if (process.argv.includes("--local")) {
  console.log("\nLOCAL MODE: source/release/operational gate verification only; external CI/staging/production evidence is not fabricated.");
}
process.exitCode = failed.length ? 1 : 0;
