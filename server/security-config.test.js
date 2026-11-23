"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("PostgreSQL is bound to localhost and obtains its password from the environment", () => {
  const compose = fs.readFileSync(path.join(__dirname, "..", "docker-compose.yml"), "utf8");
  assert.match(compose, /POSTGRES_PASSWORD:\s*\$\{DB_PASSWORD:/);
  assert.match(compose, /127\.0\.0\.1:5433:5432/);
  assert.doesNotMatch(compose, /POSTGRES_PASSWORD:\s*scout_password/);
});
