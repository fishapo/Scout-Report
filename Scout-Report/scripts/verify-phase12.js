"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const checks = [];
const check = (name, ok, detail = "") => checks.push({ name, ok: !!ok, detail });
const exists = (rel) => fs.existsSync(path.join(root, rel));
const text = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const pkg = JSON.parse(text("package.json"));
const lock = JSON.parse(text("package-lock.json"));

for (const rel of [
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
  ".github/dependabot.yml",
  "ops/observability/config.yml",
  "ops/observability/README.md",
  "docs/CI-CD.md",
  "scripts/build-release-artifact.sh",
  "server/metrics.js",
  "server/metrics.test.js",
  "server/integration.runtime.test.js",
  "server/routes/metrics.routes.js",
  "docs/admin-crud/40-PHASE12-COMPLETION-REPORT.md",
  "docs/admin-crud/41-PHASE13-START-PACK.md",
]) check(`exists: ${rel}`, exists(rel));

check("phase12 npm script present", pkg.scripts["verify:phase12"] === "node scripts/verify-phase12.js");
check("release artifact npm script present", pkg.scripts["release:artifact"] === "bash scripts/build-release-artifact.sh");
check("release check points to phase12", pkg.scripts["release:check"] === "npm run verify:phase15");
check("package lock root metadata consistent", lock.name === pkg.name && lock.version === pkg.version);
check("CI runs clean npm ci", text(".github/workflows/ci.yml").includes("npm ci"));
check("CI provisions PostgreSQL 16", text(".github/workflows/ci.yml").includes("postgres:16-alpine"));
check("CI applies migration", text(".github/workflows/ci.yml").includes("server/migrations/init.sql"));
check("CI runs all phase gates through 15", text(".github/workflows/ci.yml").includes('for phase in {1..15}'));
check("CI runs full npm test", text(".github/workflows/ci.yml").includes("npm test"));
check("CI runs DB integration", text(".github/workflows/ci.yml").includes("RUN_DB_INTEGRATION"));
check("release workflow uses protected environment", text(".github/workflows/release.yml").includes("environment: ${{ inputs.environment }}"));
check("Dependabot npm configured", text(".github/dependabot.yml").includes("package-ecosystem: npm"));
check("Dependabot Actions configured", text(".github/dependabot.yml").includes("package-ecosystem: github-actions"));
check("metrics middleware mounted", text("server/app.js").includes("metricsMiddleware"));
check("admin metrics route protected", text("server/routes/metrics.routes.js").includes('auth.authorizeRoles("admin")'));
check("metrics route mounted", text("server/routes/index.js").includes('"/admin/metrics"'));
check("metrics tracks 5xx", text("server/metrics.js").includes("res.statusCode >= 500"));
check("observability thresholds versioned", text("ops/observability/config.yml").includes("api_5xx_rate"));
check("release artifact creates checksum", text("scripts/build-release-artifact.sh").includes("sha256sum"));
check("release artifact excludes secrets", text("scripts/build-release-artifact.sh").includes("./.env"));
check("public reference route remains mounted", text("server/routes/index.js").includes('"/reference"'));
check("public reference controller unchanged shape", text("server/controllers/reference.controller.js").includes("res.json(await store.getReference())"));

for (const rel of [
  "server/metrics.js", "server/metrics.test.js", "server/integration.runtime.test.js",
  "server/routes/metrics.routes.js", "server/app.js", "server/routes/index.js", "scripts/verify-phase12.js"
]) {
  try { execFileSync(process.execPath, ["--check", path.join(root, rel)], { stdio: "ignore" }); check(`syntax: ${rel}`, true); }
  catch { check(`syntax: ${rel}`, false); }
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} | ${c.name}${c.detail ? ` | ${c.detail}` : ""}`);
console.log(`\nChecks: ${checks.length}`);
console.log(`Passed: ${checks.length - failed.length}`);
console.log(`Failed: ${failed.length}`);
process.exitCode = failed.length ? 1 : 0;
