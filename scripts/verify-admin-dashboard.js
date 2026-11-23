#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "previews", "admin-dashboard.html");
const html = fs.readFileSync(file, "utf8");

const required = [
    'href="#reference-data"',
    'id="reference-data"',
    'id="reference-farms"',
    'id="reference-crops"',
    'id="reference-pests"',
    'id="reference-diseases"',
    'loadReferenceData()',
    'renderReferenceFarms',
    'renderReferenceCrops',
    'renderReferencePests',
    'renderReferenceDiseases',
    'escapeHtml',
    '`${API}/reference/farms`',
    '`${API}/reference/crop-types`',
    '`${API}/reference/pests`',
    '`${API}/reference/diseases`'
];

const failures = required.filter((value) => !html.includes(value));

if (html.includes("/admin-reference.html")) {
    failures.push("legacy /admin-reference.html link");
}

if (failures.length) {
    console.error("Admin dashboard UI verification failed:");
    failures.forEach((item) => console.error(`- ${item}`));
    process.exit(1);
}

console.log("✓ Admin dashboard reference-data UI verification passed.");
