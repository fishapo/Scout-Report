#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();
const IGNORE = new Set(["node_modules", ".git"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(path.relative(ROOT, full));
  }
  return out;
}

const files = walk(ROOT);
const jsFiles = files.filter(f => /\.(?:js|mjs|cjs)$/.test(f));
const tests = jsFiles.filter(f => /\.test\.(?:js|mjs|cjs)$/.test(f));

console.log(`Project: ${ROOT}`);
console.log(`Files: ${files.length}`);
console.log(`JS/module files: ${jsFiles.length}`);
console.log(`Test files: ${tests.length}`);

let syntaxFailures = 0;
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", path.join(ROOT, file)], { encoding: "utf8" });
  if (result.status !== 0) {
    syntaxFailures++;
    console.error(`SYNTAX FAIL: ${file}`);
    console.error(result.stderr || result.stdout);
  }
}
console.log(`Syntax failures: ${syntaxFailures}`);

const pkgPath = path.join(ROOT, "package.json");
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  for (const [name, command] of Object.entries(pkg.scripts || {})) {
    console.log(`SCRIPT ${name}: ${command}`);
  }
}

console.log("\nRecommended next command:");
console.log("npm test");
process.exitCode = syntaxFailures ? 1 : 0;
