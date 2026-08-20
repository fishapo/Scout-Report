const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createResponse(status, body = {}, headers = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers,
    json: async () => body,
  };
}

function loadBrowserAuth({ initialStorage = null, fetchHandler } = {}) {
  const authJs = fs.readFileSync(path.join(__dirname, 'auth.js'), 'utf8');
  const storage = new Map();

  if (initialStorage !== null) {
    storage.set('scout-report-auth', JSON.stringify(initialStorage));
  }

  const sessionStorage = {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    },
  };

  const window = {
    location: {
      href: 'about:blank',
    },
  };

  const fetchCalls = [];
  const fetch = async (input, options = {}) => {
    fetchCalls.push({ input, options });
    if (typeof fetchHandler === 'function') {
      return fetchHandler(input, options);
    }
    throw new Error(`Unexpected fetch call to ${input}`);
  };

  const sandbox = vm.createContext({ window, sessionStorage, fetch, console, URL, TextEncoder, TextDecoder });
  vm.runInContext(authJs, sandbox, { filename: 'auth.js' });

  return {
    browserAuth: sandbox.window.browserAuth,
    sessionStorage,
    fetchCalls,
    window,
  };
}

test('browser auth login stores token and user state in sessionStorage', async () => {
  const { browserAuth, sessionStorage, fetchCalls } = loadBrowserAuth({
    fetchHandler: async (input, options) => {
      assert.equal(input, '/auth/login');
      assert.equal(options.method, 'POST');
      return createResponse(200, {
        token: 'token-123',
        user: { id: 'user-1', email: 'scout@example.com', role: 'scout' },
      });
    },
  });

  const result = await browserAuth.login({ email: 'scout@example.com', password: 'StrongPass123' });
  assert.equal(result.token, 'token-123');
  assert.equal(browserAuth.getToken(), 'token-123');
  assert.equal(browserAuth.getUser().email, 'scout@example.com');

  const stored = JSON.parse(sessionStorage.getItem('scout-report-auth'));
  assert.equal(stored.token, 'token-123');
  assert.equal(stored.user.email, 'scout@example.com');
  assert.equal(fetchCalls.length, 1);
});

test('fetchWithAuth attaches bearer token and clears state on 401', async () => {
  const { browserAuth, sessionStorage, fetchCalls, window } = loadBrowserAuth({
    initialStorage: { token: 'token-123', user: { id: 'user-1', email: 'scout@example.com', role: 'scout' } },
    fetchHandler: async (input, options) => {
      assert.equal(input, '/protected');
      assert.equal(options.headers.Authorization, 'Bearer token-123');
      return createResponse(401, { error: 'Unauthorized' });
    },
  });

  await assert.rejects(() => browserAuth.fetchWithAuth('/protected'), {
    message: 'Unauthorized',
  });

  assert.equal(browserAuth.getToken(), null);
  assert.equal(browserAuth.getUser(), null);
  assert.equal(sessionStorage.getItem('scout-report-auth'), null);
  assert.equal(window.location.href, '/login');
  assert.equal(fetchCalls.length, 1);
});

test('logout clears stored auth state and redirects to login', async () => {
  const { browserAuth, sessionStorage, window, fetchCalls } = loadBrowserAuth({
    initialStorage: { token: 'token-123', user: { id: 'user-1', email: 'scout@example.com', role: 'scout' } },
    fetchHandler: async (input, options) => {
      assert.equal(input, '/auth/logout');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.Authorization, 'Bearer token-123');
      return createResponse(204, null);
    },
  });

  await browserAuth.logout();

  assert.equal(browserAuth.getToken(), null);
  assert.equal(browserAuth.getUser(), null);
  assert.equal(sessionStorage.getItem('scout-report-auth'), null);
  assert.equal(window.location.href, '/login');
  assert.equal(fetchCalls.length, 1);
});

test('init loads authenticated user from saved token via /auth/me', async () => {
  const { browserAuth, sessionStorage, fetchCalls } = loadBrowserAuth({
    initialStorage: { token: 'token-123', user: null },
    fetchHandler: async (input, options) => {
      assert.equal(input, '/auth/me');
      assert.equal(options.headers.Authorization, 'Bearer token-123');
      return createResponse(200, { user: { id: 'user-1', email: 'scout@example.com', role: 'scout' } });
    },
  });

  const user = await browserAuth.init({ redirectOnUnauthenticated: false });
  assert.equal(user.email, 'scout@example.com');
  assert.equal(browserAuth.getUser().role, 'scout');
  assert.equal(fetchCalls.length, 1);
  const stored = JSON.parse(sessionStorage.getItem('scout-report-auth'));
  assert.equal(stored.user.email, 'scout@example.com');
});


test('init restores an authenticated browser session from the HttpOnly cookie', async () => {
  const { browserAuth, fetchCalls } = loadBrowserAuth({
    fetchHandler: async (input, options) => {
      assert.equal(input, '/auth/me');
      assert.equal(options.credentials, 'include');
      assert.deepEqual(options.headers, {});
      return createResponse(200, { user: { id: 'user-2', email: 'cookie@example.com', role: 'scout' } });
    },
  });

  const user = await browserAuth.init({ redirectOnUnauthenticated: false });
  assert.equal(user.email, 'cookie@example.com');
  assert.equal(fetchCalls.length, 1);
});
