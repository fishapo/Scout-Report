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
  "scripts/verify-phase18.js",
  "scripts/verify-phase19.js",
  "scripts/generate-slo-report.js",
  "scripts/generate-reliability-review.js", "scripts/verify-dependencies.js",
  "scripts/staging-smoke.sh",
  "scripts/backup-postgres.sh",
  "scripts/restore-postgres.sh",
  "scripts/build-release-artifact.sh",
  "docs/operations/PHASE18-LIVE-EVIDENCE.md",
  "docs/operations/PHASE18-LOCAL-ACCEPTANCE-2026-08-10.md",
  "docs/operations/PHASE18-RELEASE-RUNBOOK.md",
  "docs/operations/PHASE18-DR-ROLLBACK-RECORD.md",
  "docs/operations/PHASE19-LIVE-EVIDENCE.md",
  "docs/operations/PHASE19-LOCAL-ACCEPTANCE-2026-08-10.md",
  "docs/operations/PHASE19-RELEASE-RUNBOOK.md",
  "docs/operations/PHASE19-DR-ROLLBACK-RECORD.md",
  "docs/operations/SLO-REPORT-TEMPLATE.md",
  "docs/operations/RELIABILITY-REVIEW-TEMPLATE.md",
  "docs/operations/INCIDENT-ACTION-REGISTER.md",
  "docs/admin-crud/54-PHASE18-COMPLETION-REPORT.md",
  "docs/admin-crud/55-PHASE19-START-PACK.md",
  "docs/admin-crud/56-PHASE19-COMPLETION-REPORT.md",
  "docs/admin-crud/57-PHASE20-START-PACK.md",
  "ops/slo-baseline.md",
  "ops/continuous-improvement.md",
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
  "README.md",
  "NEXT-DEV-STEP.md"
];
for (const rel of requiredFiles) check(`exists: ${rel}`, exists(rel));

check("phase17 npm script retained", pkg.scripts["verify:phase17"] === "node scripts/verify-phase17.js");
check("phase18 npm script retained", pkg.scripts["verify:phase18"] === "node scripts/verify-phase18.js");
check("phase19 npm script present", pkg.scripts["verify:phase19"] === "node scripts/verify-phase19.js");
check("dependency verification script present", pkg.scripts["verify:dependencies"] === "node scripts/verify-dependencies.js");
check("pretest dependency gate present", pkg.scripts.pretest === "node scripts/verify-dependencies.js");
check("npm registry is pinned", exists(".npmrc") && text(".npmrc").includes("registry=https://registry.npmjs.org/"));
check("local phase18 verifier retained", pkg.scripts["verify:phase18:local"] === "node scripts/verify-phase18.js --local");
check("release check points to phase19", pkg.scripts["release:check"] === "npm run verify:phase19");
check("phase16 gate remains callable", pkg.scripts["verify:phase16"] === "node scripts/verify-phase16.js");
check("phase17 gate remains callable", pkg.scripts["verify:phase17"] === "node scripts/verify-phase17.js");
check("phase18 gate remains callable", pkg.scripts["verify:phase18"] === "node scripts/verify-phase18.js");
check("SLO report generator retained", pkg.scripts["report:slo"] === "node scripts/generate-slo-report.js");
check("reliability review generator retained", pkg.scripts["review:reliability"] === "node scripts/generate-reliability-review.js");

const ci = text(".github/workflows/ci.yml");
const release = text(".github/workflows/release.yml");
const live = text("docs/operations/PHASE19-LIVE-EVIDENCE.md");
const local = text("docs/operations/PHASE19-LOCAL-ACCEPTANCE-2026-08-10.md");
const completion = text("docs/admin-crud/56-PHASE19-COMPLETION-REPORT.md");
const next = text("docs/admin-crud/57-PHASE20-START-PACK.md");
const slo = text("scripts/generate-slo-report.js");
const reliability = text("scripts/generate-reliability-review.js");

check("CI runs phase gates through 19", ci.includes("for phase in {1..19}"));
check("CI uses clean npm ci", ci.includes("npm ci"));
check("CI runs full npm test", ci.includes("npm test"));
check("CI enables DB integration", ci.includes('RUN_DB_INTEGRATION: "1"'));
check("CI applies PostgreSQL schema", ci.includes("server/migrations/init.sql"));
check("CI uploads phase19 evidence", ci.includes("phase19-evidence"));
check("CI builds release artifact", ci.includes("npm run release:artifact"));
check("CI validates artifact checksum", ci.includes("sha256sum -c"));
check("release uses protected environment", release.includes("environment: ${{ inputs.environment }}"));
check("release gate is phase19", release.includes("npm run release:check"));
check("release runs staging smoke", release.includes("npm run smoke:staging"));
check("release captures phase19 evidence", release.includes("PHASE19-LIVE-EVIDENCE"));
check("release preserves approval boundary", release.includes("required reviewers"));

check("Phase19 evidence distinguishes pending from pass", live.toLowerCase().includes("pending") && live.toLowerCase().includes("not a pass"));
check("Phase19 evidence requires run identity", live.includes("CI run URL") && live.toLowerCase().includes("release commit"));
check("Phase19 evidence requires timestamps", live.toLowerCase().includes("timestamp"));
check("Phase19 local evidence identifies localhost runtime", local.includes("localhost:3003"));
check("Phase19 local evidence retains observed login", local.includes("POST /auth/login") && local.includes("200"));
check("Phase19 local evidence retains PostgreSQL", local.toLowerCase().includes("postgresql"));
check("completion report forbids invented measurements", completion.toLowerCase().includes("do not invent"));
check("completion report defines measured reliability boundary", completion.includes("measured reliability"));
check("next phase explicitly defined", next.includes("Phase 20"));
check("Scout public API compatibility remains explicit", completion.includes("/api/reference/*"));
check("admin namespace remains separate", completion.includes("/api/admin/reference/*"));
check("admin metrics remains protected", text("server/routes/metrics.routes.js").includes('auth.authorizeRoles("admin")'));
check("SLO generator refuses missing data", slo.includes("No SLO data supplied"));
check("SLO generator uses supplied evidence", slo.includes("Source: supplied production evidence"));
check("reliability generator refuses missing data", reliability.includes("No reliability data supplied"));
check("reliability generator uses supplied evidence", reliability.includes("Source: supplied operational evidence"));
check("backup script retained", exists("scripts/backup-postgres.sh"));
check("restore script retained", exists("scripts/restore-postgres.sh"));
check("rollback gate documented", completion.toLowerCase().includes("rollback"));
check("7-day/30-day cycle documented", next.includes("7-day") && next.includes("30-day"));

for (const phase of [16, 17, 18, 19]) {
  const rel = `scripts/verify-phase${phase}.js`;
  try { execFileSync(process.execPath, ["--check", path.join(root, rel)], { stdio: "ignore" }); check(`syntax: ${rel}`, true); }
  catch { check(`syntax: ${rel}`, false); }
}
for (const rel of [
  "scripts/generate-slo-report.js", "scripts/generate-reliability-review.js", "scripts/verify-dependencies.js",
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
if (process.argv.includes("--local")) console.log("\nLOCAL MODE: Phase 19 engineering/evidence gate only; no external CI/staging/production results are fabricated.");
process.exitCode = failed.length ? 1 : 0;
