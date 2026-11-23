"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const guard = require("./sameOriginWrites");

function invoke({ method = "POST", cookies = {}, headers = {} } = {}) {
  let nextCalled = false; let status = 200; let body;
  const req = { method, cookies, get: (name) => headers[name.toLowerCase()] };
  const res = { status(code) { status = code; return this; }, json(value) { body = value; return this; } };
  guard(req, res, () => { nextCalled = true; });
  return { nextCalled, status, body };
}

test("cookie-authenticated writes require a matching Origin", () => {
  assert.equal(invoke({ method: "GET", cookies: { access_token: "x" } }).nextCalled, true);
  assert.equal(invoke({ cookies: {} }).nextCalled, true);
  assert.equal(invoke({ cookies: { access_token: "x" }, headers: { host: "localhost:3000", origin: "http://localhost:3000" } }).nextCalled, true);
  assert.equal(invoke({ cookies: { access_token: "x" }, headers: { host: "localhost:3000", origin: "https://evil.example" } }).status, 403);
  assert.equal(invoke({ cookies: { access_token: "x" }, headers: { host: "localhost:3000" } }).status, 403);
  assert.equal(invoke({ cookies: { access_token: "x" }, headers: { authorization: "Bearer api-token" } }).nextCalled, true);
});
