"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

if (process.env.RUN_DB_INTEGRATION !== "1") {
  test("PostgreSQL runtime integration (set RUN_DB_INTEGRATION=1 to run)", { skip: true }, () => {});
} else {
  const { createApp } = require("./app");
  const db = require("./db");

  test("PostgreSQL-backed health, public reference and admin metrics boundary", async () => {
    const health = await db.getHealth();
    assert.equal(health.status, "healthy");

    const server = http.createServer(createApp());
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;

    try {
      const healthResponse = await fetch(`${base}/api/health`);
      assert.equal(healthResponse.status, 200);
      const healthBody = await healthResponse.json();
      assert.equal(healthBody.database, "connected");

      const farmsResponse = await fetch(`${base}/api/reference/farms`);
      assert.equal(farmsResponse.status, 200);
      const farms = await farmsResponse.json();
      assert.ok(Array.isArray(farms));

      const metricsResponse = await fetch(`${base}/api/admin/metrics`);
      assert.equal(metricsResponse.status, 401);
    } finally {
      await new Promise((resolve) => server.close(resolve));
      await db.close();
    }
  });
}
