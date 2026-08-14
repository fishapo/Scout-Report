"use strict";

const required = ["express", "dotenv", "pg", "cookie-parser", "cors"];
const missing = [];

for (const name of required) {
  try {
    require.resolve(`${name}/package.json`);
  } catch {
    missing.push(name);
  }
}

if (missing.length) {
  console.error("ERROR | Missing npm dependencies:", missing.join(", "));
  console.error("Run: npm ci --registry=https://registry.npmjs.org/");
  process.exit(1);
}

console.log("PASS | required runtime dependencies are installed");
