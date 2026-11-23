"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const checks = [];

function check(name, condition, detail = "") {
    checks.push({ name, passed: Boolean(condition), detail });
}

function read(relative) {
    return fs.readFileSync(path.join(root, relative), "utf8");
}

function exists(relative) {
    return fs.existsSync(path.join(root, relative));
}

const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));

check("packageManager is pinned", pkg.packageManager === "npm@10.9.2", pkg.packageManager);
check("package-lock is lockfileVersion 3", lock.lockfileVersion === 3, String(lock.lockfileVersion));
check("package-lock root matches package.json", JSON.stringify(lock.packages?.[""]?.dependencies) === JSON.stringify(pkg.dependencies), "dependency root parity");
check("package-lock devDependencies match", JSON.stringify(lock.packages?.[""]?.devDependencies) === JSON.stringify(pkg.devDependencies), "devDependency root parity");
check("project npm registry is pinned", read(".npmrc").includes("registry=https://registry.npmjs.org/"));
check(".env is ignored", read(".gitignore").split(/\r?\n/).includes(".env"));
check("production JWT fallback is rejected", read("server/index.js").includes("JWT_SECRET must not use the development fallback in production"));
check("production required DB/JWT variables are validated", read("server/index.js").includes('const required = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD", "JWT_SECRET"]'));
check("production cookie is secure", read("server/controllers/auth.controller.js").includes('secure:\n        process.env.NODE_ENV === "production"'));
check("authentication attempts are rate limited", read("server/routes/auth.routes.js").includes("authenticationAttemptLimiter"));
check("security headers middleware is mounted", read("server/app.js").includes("app.use(securityHeaders)"));
check("health endpoint reports DB state", read("server/routes/health.routes.js").includes("getHealth"));
check("admin reference routes remain mounted", read("server/routes/index.js").includes('"/admin/reference"'));
check("public reference routes remain mounted", read("server/routes/index.js").includes('"/reference"'));
check("phase 8 verifier exists", exists("scripts/verify-phase8.js"));
check("phase 9 start pack exists", exists("docs/admin-crud/33-PHASE9-START-PACK.md"));
check("docker PostgreSQL setup exists", exists("docker-compose.yml"));
check("database migration exists", exists("server/migrations/init.sql"));
check("README documents clean install", read("README.md").includes("npm ci"));

const syntaxTargets = [
    "server/index.js",
    "server/app.js",
    "server/config/env.js",
    "server/db.js",
    "server/auth.js",
    "server/controllers/auth.controller.js",
    "server/routes/auth.routes.js",
    "server/routes/index.js",
    "scripts/verify-phase8.js",
];

for (const file of syntaxTargets) {
    try {
        execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "ignore" });
        check(`syntax: ${file}`, true);
    } catch (error) {
        check(`syntax: ${file}`, false, String(error.status ?? error.message));
    }
}

const failed = checks.filter((item) => !item.passed);
console.log("Phase 9 Production Hardening Verification");
console.log("===========================================");
for (const item of checks) {
    console.log(`${item.passed ? "PASS" : "FAIL"} | ${item.name}${item.detail ? ` | ${item.detail}` : ""}`);
}
console.log("-------------------------------------------");
console.log(`Checks: ${checks.length}`);
console.log(`Passed: ${checks.length - failed.length}`);
console.log(`Failed: ${failed.length}`);

process.exitCode = failed.length ? 1 : 0;
