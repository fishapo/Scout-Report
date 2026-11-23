"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const root = path.resolve(__dirname, "..");
const checks = [];
const check = (name, ok) => checks.push({ name, ok: !!ok });
const exists = (rel) => fs.existsSync(path.join(root, rel));
const text = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const pkg = JSON.parse(text("package.json"));

for (const rel of [
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
  ".github/dependabot.yml",
  "scripts/staging-smoke.sh",
  "scripts/verify-phase13.js",
  "scripts/backup-postgres.sh",
  "scripts/restore-postgres.sh",
  "ops/observability/config.yml",
  "docs/CI-CD.md",
  "docs/operations/PHASE11-DR-TEST-RECORD-TEMPLATE.md",
  "docs/admin-crud/41-PHASE13-START-PACK.md",
  "docs/admin-crud/42-PHASE13-COMPLETION-REPORT.md"
]) check(`exists: ${rel}`, exists(rel));

check("phase13 npm script present", pkg.scripts["verify:phase13"] === "node scripts/verify-phase13.js");
check("release check points to phase13", pkg.scripts["release:check"] === "npm run verify:phase15");
check("CI provisions PostgreSQL 16", text(".github/workflows/ci.yml").includes("postgres:16-alpine"));
check("CI uses clean install", text(".github/workflows/ci.yml").includes("npm ci"));
check("CI runs phase gates through 15", text(".github/workflows/ci.yml").includes("for phase in {1..15}"));
check("CI runs full test suite", text(".github/workflows/ci.yml").includes("npm test"));
check("CI runs DB integration", text(".github/workflows/ci.yml").includes("RUN_DB_INTEGRATION"));
check("CI builds release artifact", text(".github/workflows/ci.yml").includes("npm run release:artifact"));
check("release workflow has protected environment", text(".github/workflows/release.yml").includes("environment: ${{ inputs.environment }}"));
check("release workflow runs phase13 gate", text(".github/workflows/release.yml").includes("npm run release:check"));
check("release workflow exposes approval boundary", text(".github/workflows/release.yml").includes("required reviewers"));
check("staging smoke script uses health endpoint", text("scripts/staging-smoke.sh").includes("/api/health"));
check("staging smoke script checks admin metrics", text("scripts/staging-smoke.sh").includes("/api/admin/metrics"));
check("staging smoke script checks reference API", text("scripts/staging-smoke.sh").includes("/api/reference/farms"));
check("staging smoke script checks request correlation", text("scripts/staging-smoke.sh").includes("x-request-id"));
check("DR template requires backup and restore evidence", text("docs/operations/PHASE11-DR-TEST-RECORD-TEMPLATE.md").toLowerCase().includes("restore"));
check("observability config has thresholds", text("ops/observability/config.yml").includes("api_5xx_rate"));
check("public reference route remains mounted", text("server/routes/index.js").includes('"/reference"'));
check("admin metrics remains protected", text("server/routes/metrics.routes.js").includes('auth.authorizeRoles("admin")'));
check("release artifact excludes .env", text("scripts/build-release-artifact.sh").includes("./.env"));
check("release artifact creates checksum", text("scripts/build-release-artifact.sh").includes("sha256sum"));

for (const rel of [
  "scripts/verify-phase13.js", "server/app.js", "server/routes/index.js", "server/routes/metrics.routes.js",
  "server/metrics.js", "server/integration.runtime.test.js", "scripts/verify-phase12.js"
]) {
  try { execFileSync(process.execPath, ["--check", path.join(root, rel)], { stdio: "ignore" }); check(`syntax: ${rel}`, true); }
  catch { check(`syntax: ${rel}`, false); }
}

for (const rel of ["scripts/staging-smoke.sh", "scripts/backup-postgres.sh", "scripts/restore-postgres.sh"]) {
  try { execFileSync("bash", ["-n", path.join(root, rel)], { stdio: "ignore" }); check(`shell syntax: ${rel}`, true); }
  catch { check(`shell syntax: ${rel}`, false); }
}

const failed = checks.filter(c => !c.ok);
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} | ${c.name}`);
console.log(`\nChecks: ${checks.length}`);
console.log(`Passed: ${checks.length - failed.length}`);
console.log(`Failed: ${failed.length}`);
process.exitCode = failed.length ? 1 : 0;
