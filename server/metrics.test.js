"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { metricsMiddleware, snapshot } = require("./metrics");

test("metrics middleware records request status and duration", async () => {
  const before = snapshot();
  const server = http.createServer((req, res) => {
    metricsMiddleware(req, res, () => {
      res.statusCode = 204;
      res.end();
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await fetch(`http://127.0.0.1:${port}/metrics-test`);
  await new Promise((resolve) => server.close(resolve));

  const after = snapshot();
  assert.equal(after.requests, before.requests + 1);
  assert.equal(after.byStatus[204], (before.byStatus[204] || 0) + 1);
  assert.equal(after.byRoute["GET /metrics-test"], (before.byRoute["GET /metrics-test"] || 0) + 1);
});
