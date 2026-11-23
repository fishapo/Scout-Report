"use strict";

const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");

function clearModules() {
  for (const p of ["./controllers/admin/users.controller", "./db", "./auth"]) {
    try { delete require.cache[require.resolve(p)]; } catch (_) {}
  }
}

function fake(filename, exports) {
  return { id: filename, filename, loaded: true, exports };
}

afterEach(clearModules);

test("admin can reset an HOD password and revoke existing sessions", async () => {
  clearModules();
  const dbPath = require.resolve("./db");
  const authPath = require.resolve("./auth");
  const calls = [];
  const db = {
    query: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.includes("SELECT id, email, name, role, is_active FROM users")) {
        return { rowCount: 1, rows: [{ id: "hod-1", email: "lathyflora69@gmail.com", name: "Head of Department", role: "head_of_department", is_active: true }] };
      }
      if (sql.includes("UPDATE users SET password_hash")) {
        return { rowCount: 1, rows: [{ id: "hod-1", email: "lathyflora69@gmail.com", name: "Head of Department", role: "head_of_department", is_active: true }] };
      }
      return { rowCount: 1, rows: [] };
    },
  };
  const auth = { hashPassword: async (password) => `HASH:${password}` };
  require.cache[dbPath] = fake(dbPath, db);
  require.cache[authPath] = fake(authPath, auth);

  const controller = require("./controllers/admin/users.controller");
  const response = {};
  response.status = (code) => { response.statusCode = code; return response; };
  response.json = (body) => { response.body = body; return response; };
  const errors = [];
  await controller.setPassword(
    { params: { id: "hod-1" }, body: { password: "NewSecurePass123!" } },
    response,
    (error) => errors.push(error),
  );

  assert.equal(errors.length, 0);
  assert.equal(response.statusCode, undefined);
  assert.equal(response.body.success, true);
  assert.equal(response.body.user.email, "lathyflora69@gmail.com");
  assert.ok(calls.some((c) => c.sql.includes("UPDATE user_sessions SET revoked_at=NOW()")));
});

test("admin password reset rejects weak passwords", async () => {
  clearModules();
  const dbPath = require.resolve("./db");
  const authPath = require.resolve("./auth");
  require.cache[dbPath] = fake(dbPath, { query: async () => { throw new Error("DB should not be queried for weak passwords"); } });
  require.cache[authPath] = fake(authPath, { hashPassword: async () => "unused" });
  const controller = require("./controllers/admin/users.controller");
  const response = {};
  response.status = (code) => { response.statusCode = code; return response; };
  response.json = (body) => { response.body = body; return response; };
  await controller.setPassword(
    { params: { id: "hod-1" }, body: { password: "short" } },
    response,
    () => assert.fail("weak password should not reach next()"),
  );
  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /at least 8/i);
});
