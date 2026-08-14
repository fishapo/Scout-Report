"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const input = process.argv[2] || process.env.RELIABILITY_DATA_FILE;
if (!input) { console.error("No reliability data supplied; refusing to invent findings."); process.exit(2); }
const file = path.resolve(root, input);
if (!fs.existsSync(file)) { console.error(`Reliability data file not found: ${file}`); process.exit(2); }
const data = JSON.parse(fs.readFileSync(file, "utf8"));
for (const key of ["period", "incidents", "deployments", "rollbacks", "backupRestoreVerified", "topActions"]) {
  if (data[key] === undefined) { console.error(`Missing required field: ${key}`); process.exit(2); }
}
const out = path.join(root, "reports"); fs.mkdirSync(out, { recursive: true });
const actions = Array.isArray(data.topActions) ? data.topActions : [];
const md = `# Scout Report Reliability Review\n\nPeriod: ${data.period}\n\n- Incidents: ${data.incidents}\n- Deployments: ${data.deployments}\n- Rollbacks: ${data.rollbacks}\n- Backup/restore verified: ${data.backupRestoreVerified ? "Yes" : "No"}\n\n## Priority Actions\n${actions.map(a => `- ${a}`).join("\n")}\n\nSource: supplied operational evidence.\n`;
fs.writeFileSync(path.join(out, `RELIABILITY-${String(data.period).replace(/[^a-zA-Z0-9_-]/g, "_")}.md`), md);
console.log("Reliability review generated from supplied evidence.");
