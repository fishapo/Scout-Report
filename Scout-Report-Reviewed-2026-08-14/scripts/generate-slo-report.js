"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const input = process.argv[2] || process.env.SLO_DATA_FILE;
if (!input) {
  console.error("No SLO data supplied. Refusing to invent production measurements.");
  console.error("Usage: node scripts/generate-slo-report.js path/to/slo-data.json");
  process.exit(2);
}
const file = path.resolve(root, input);
if (!fs.existsSync(file)) { console.error(`SLO data file not found: ${file}`); process.exit(2); }
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const required = ["period", "availability", "errorRate5xx", "averageLatencyMs", "backupFreshnessHours"];
for (const key of required) if (data[key] === undefined) { console.error(`Missing required field: ${key}`); process.exit(2); }
const out = path.join(root, "reports"); fs.mkdirSync(out, { recursive: true });
const report = `# Scout Report SLO Report\n\nPeriod: ${data.period}\n\n| Indicator | Measured | Target | Status |\n|---|---:|---:|---|\n| Availability | ${data.availability}% | >= 99.5% | ${data.availability >= 99.5 ? "PASS" : "FAIL"} |\n| 5xx error rate | ${data.errorRate5xx}% | < 1.0% | ${data.errorRate5xx < 1 ? "PASS" : "FAIL"} |\n| Average latency | ${data.averageLatencyMs} ms | < 750 ms | ${data.averageLatencyMs < 750 ? "PASS" : "FAIL"} |\n| Backup freshness | ${data.backupFreshnessHours} h | <= 24 h | ${data.backupFreshnessHours <= 24 ? "PASS" : "FAIL"} |\n\nSource: supplied production evidence. No values are inferred or fabricated.\n`;
fs.writeFileSync(path.join(out, `SLO-${String(data.period).replace(/[^a-zA-Z0-9_-]/g, "_")}.md`), report);
console.log("SLO report generated from supplied evidence.");
