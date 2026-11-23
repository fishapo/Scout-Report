"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const checks = [
  ["HOD dashboard page", "previews/head-of-department-dashboard.html"],
  ["HOD dashboard route", "server/app.js"],
  ["HOD role in authentication", "server/auth.js"],
  ["HOD workflow stage", "server/workflow.js"],
  ["Workflow routes", "server/routes/workflow.routes.js"],
  ["Admin user management", "server/routes/admin/users.routes.js"],
  ["Admin password reset implementation", "server/controllers/admin/users.controller.js"],
  ["Shared API dashboard", "server/routes/dashboard.routes.js"],
];
for (const [label, rel] of checks) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`MISSING: ${label} (${rel})`);
}
const app = fs.readFileSync(path.join(root, "server/app.js"), "utf8");
const auth = fs.readFileSync(path.join(root, "server/auth.js"), "utf8");
const users = fs.readFileSync(path.join(root, "server/routes/admin/users.routes.js"), "utf8");
const dash = fs.readFileSync(path.join(root, "previews/head-of-department-dashboard.html"), "utf8");
for (const [label, text, needle] of [
  ["HOD dashboard route", app, '"/head-of-department-dashboard"'],
  ["HOD role authorization", app, 'requirePageRole("head_of_department")'],
  ["HOD role allowed", auth, '"head_of_department"'],
  ["Admin password endpoint", users, 'router.patch("/:id/password"'],
  ["HOD dashboard workflow UI", dash, "Head of Department Queue"],
  ["HOD dashboard workflow script", dash, "/assets/workflow-dashboard.js"],
]) if (!text.includes(needle)) throw new Error(`MISSING: ${label}`);
console.log("HOD WORKFLOW VERIFICATION PASSED");
console.log("Role: head_of_department");
console.log("Browser route: /head-of-department-dashboard");
console.log("Workflow: scout -> inter_farm_supervisor -> head_of_department -> admin");
console.log("Admin role assignment: /api/admin/users/:id/role");
console.log("Admin password reset: /api/admin/users/:id/password");
