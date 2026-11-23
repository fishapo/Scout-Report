"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
let checks = 0;
let passed = 0;

function check(name, condition, detail = "") {
  checks += 1;
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
function read(rel) { return fs.readFileSync(path.join(root, rel), "utf8"); }
function exists(rel) { return fs.existsSync(path.join(root, rel)); }

const publicRoute = read("server/routes/reference.routes.js");
const expectedPublicHash = "4c20b4ed7d05575a0efbd91b79cdf259f3f07523ae9250cb94d96bb357dcd46a";
const publicHash = crypto.createHash("sha256").update(publicRoute).digest("hex");

check("public reference router hash", publicHash === expectedPublicHash, publicHash);
check("canonical public reference mount", read("server/routes/index.js").includes('router.use(\n    "/reference",\n    referenceRoutes'));
check("admin reference isolated mount", read("server/routes/index.js").includes('router.use(\n    "/admin/reference",\n    adminReferenceRoutes'));

const adminRoutes = read("server/routes/admin/reference.routes.js");
check("admin authentication middleware", adminRoutes.includes("auth.authenticate"));
check("admin role middleware", adminRoutes.includes('auth.authorizeRoles("admin")'));
check("all five CRUD domains mounted", ["/farms", "/crop-types", "/pests", "/diseases"].every(x => adminRoutes.includes(x)) && adminRoutes.includes("/crop-types/:cropTypeId/varieties"));

const controller = read("server/controllers/admin/reference.controller.js");
check("farm delete conflict", controller.includes("REFERENCE_IN_USE"));
check("crop type delete conflict", controller.includes("This crop type has varieties and cannot be deleted"));
check("crop variety parent scoping", controller.includes("req.params.cropTypeId"));
check("pest delete is non-cascading", !controller.includes("pest_observations"));
check("disease delete is non-cascading", !controller.includes("disease_observations"));

const store = read("server/store.js");
check("farm dependency guard in store", store.includes("dependencyCount") && store.includes("scout_reports"));
check("crop type dependency guard in store", store.includes("crop_varieties"));
check("variety parent validation in store", store.includes("getCropVarietiesAdmin") && store.includes("crop_type_id"));

const app = read("server/app.js");
const pageAuth = read("server/middleware/requirePageAuth.js");
const headers = read("server/middleware/securityHeaders.js");
check("admin dashboard page protected", app.includes('requirePageRole("admin")'));
check("scout dashboard role protected", app.includes('requirePageRole("scout")'));
check("page auth redirects unauthenticated", pageAuth.includes('res.redirect("/login")'));
check("page auth redirects unauthorized roles", pageAuth.includes('res.redirect("/dashboard")'));
check("security nosniff", headers.includes('X-Content-Type-Options'));
check("security frame protection", headers.includes('X-Frame-Options'));
check("security referrer policy", headers.includes('Referrer-Policy'));

check("admin client exists", exists("previews/admin-reference.js"));
check("admin dashboard loads client", read("previews/admin-dashboard.html").includes('/assets/admin-reference.js'));
check("admin dashboard dependency feedback", read("previews/admin-dashboard.html").includes("Delete is blocked when reports depend on a farm"));
check("admin dashboard variety immutability messaging", read("previews/admin-dashboard.html").includes("Varieties remain scoped to their crop type"));
check("browser focused tests exist", exists("previews/admin-reference.test.js") && exists("previews/browser-auth.test.js"));

const packageJson = JSON.parse(read("package.json"));
check("phase8 verification script registered", packageJson.scripts && packageJson.scripts["verify:phase8"] === "node scripts/verify-phase8.js");
check("phase8 start pack exists", exists("docs/admin-crud/31-PHASE8-START-PACK.md"));

console.log("------------------------------------------------------------");
console.log(`Checks: ${checks}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${checks - passed}`);
process.exitCode = checks === passed ? 0 : 1;
