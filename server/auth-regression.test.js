"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

function loadPageAuth(authImpl) {
  const authPath = require.resolve("./auth");
  const middlewarePath = require.resolve("./middleware/requirePageAuth");
  delete require.cache[middlewarePath];
  require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: authImpl };
  return require(middlewarePath);
}

function req({ authorization, cookie }) {
  return {
    headers: { authorization, cookie },
    get(name) {
      if (name.toLowerCase() === "authorization") return authorization || undefined;
      return undefined;
    },
    cookies: cookie ? { access_token: cookie } : {},
  };
}

function response() {
  return {
    redirects: [],
    redirect(codeOrPath, maybePath) {
      this.redirects.push(maybePath === undefined ? [302, codeOrPath] : [codeOrPath, maybePath]);
    },
  };
}

for (const role of ["scout", "inter_farm_supervisor", "head_of_department", "admin"]) {
  test(`page authentication accepts bearer credentials for ${role}`, async () => {
    const { requirePageAuth } = loadPageAuth({
      authenticate(req, _res, next) {
        assert.equal(req.get("authorization"), "Bearer good-token");
        req.user = { id: `${role}-1`, role };
        req.session = { id: "session-1" };
        next();
      },
    });
    const request = req({ authorization: "Bearer good-token" });
    const res = response();
    let called = false;
    await requirePageAuth(request, res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(request.user.role, role);
  });
}

test("page authentication accepts HttpOnly cookie credentials", async () => {
  const { requirePageAuth } = loadPageAuth({
    authenticate(req, _res, next) {
      assert.equal(req.cookies.access_token, "cookie-token");
      req.user = { id: "user-1", role: "scout" };
      next();
    },
  });
  const request = req({ cookie: "cookie-token" });
  const res = response();
  let called = false;
  await requirePageAuth(request, res, () => { called = true; });
  assert.equal(called, true);
});

test("browser authentication redirects 401 to login", async () => {
  const { requirePageAuth } = loadPageAuth({
    authenticate(_req, _res, next) {
      const error = new Error("Invalid or expired session");
      error.statusCode = 401;
      next(error);
    },
  });
  const res = response();
  let nextCalled = false;
  await requirePageAuth(req({ cookie: "expired-token" }), res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.deepEqual(res.redirects, [[302, "/login"]]);
});

test("non-authentication page errors continue to global handler", async () => {
  const { requirePageAuth } = loadPageAuth({
    authenticate(_req, _res, next) {
      const error = new Error("database unavailable");
      error.statusCode = 503;
      next(error);
    },
  });
  const res = response();
  let received;
  await requirePageAuth(req({ cookie: "token" }), res, (error) => { received = error; });
  assert.equal(received?.statusCode, 503);
});
