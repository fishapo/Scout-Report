const { after, before, test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

const originalConsoleLog = console.log;

before(() => {
  console.log = () => {};
});

after(() => {
  console.log = originalConsoleLog;
});

function loadAppWithMocks(options = {}) {
  const appPath = require.resolve('./app');
  const storePath = require.resolve('./store');
  const authPath = require.resolve('./auth');
  const dbPath = require.resolve('./db');

  delete require.cache[appPath];
  delete require.cache[storePath];
  delete require.cache[authPath];
  delete require.cache[dbPath];

  const state = {
    user: options.user || { id: 'user-1', email: 'scout@example.com', role: 'scout' },
    session: options.session || { id: 'session-1', expiresAt: '2026-06-29T16:00:00.000Z' },
    reports: options.reports || [
      {
        id: 'SR-000001',
        farmId: 'FARM-001',
        farmName: 'Green Valley Farm',
        cropType: 'Tomato',
        pestObservations: [],
        diseaseObservations: [],
        status: 'Completed',
      },
    ],
    calls: [],
    authRequired: options.authRequired !== false,
  };

  const store = {
    getReference: async () => ({
      farms: [{ id: 'FARM-001', name: 'Green Valley Farm' }],
      cropTypes: [{ id: 'CROP-001', name: 'Tomato', varieties: ['Cherry Tomato'] }],
      pests: [{ id: 'PEST-001', name: 'Whitefly' }],
      diseases: [{ id: 'DISEASE-001', name: 'Early Blight' }],
    }),
    getReports: async (filters) => {
      state.calls.push({ name: 'getReports', filters });
      if (options.getReportsError) throw options.getReportsError;
      return state.reports;
    },
    getStats: async (filters) => {
      state.calls.push({ name: 'getStats', filters });
      return { totalReports: 1, criticalIssues: 0, activeFarms: 1, responseRate: 100 };
    },
    findReport: async (id) => {
      state.calls.push({ name: 'findReport', id });
      return state.reports.find((report) => report.id === id) || null;
    },
    saveReport: async (body) => {
      state.calls.push({ name: 'saveReport', body });
      if (options.saveReportError) throw options.saveReportError;
      return { id: 'SR-000002', ...body, status: 'Completed' };
    },
    updateReport: async (id, body) => {
      state.calls.push({ name: 'updateReport', id, body });
      if (id === 'missing') return null;
      return { ...state.reports[0], ...body, id };
    },
    addPestObservation: async (id, body) => {
      state.calls.push({ name: 'addPestObservation', id, body });
      if (id === 'missing') return null;
      return { ...state.reports[0], id, pestObservations: [body] };
    },
    addDiseaseObservation: async (id, body) => {
      state.calls.push({ name: 'addDiseaseObservation', id, body });
      if (id === 'missing') return null;
      return { ...state.reports[0], id, diseaseObservations: [body] };
    },
    deleteReport: async (id) => {
      state.calls.push({ name: 'deleteReport', id });
      return id !== 'missing';
    },
  };

  const auth = {
    registerUser: async (body) => {
      state.calls.push({ name: 'registerUser', body });
      return { user: { id: 'user-2', email: body.email, role: 'scout' }, token: 'token', expiresAt: state.session.expiresAt };
    },
    loginUser: async (body) => {
      state.calls.push({ name: 'loginUser', body });
      if (options.loginError) throw options.loginError;
      return { user: state.user, token: 'token', expiresAt: state.session.expiresAt };
    },
    logoutSession: async (sessionId) => {
      state.calls.push({ name: 'logoutSession', sessionId });
    },
    authenticate: (req, _res, next) => {
      if (state.authRequired && req.get('authorization') !== 'Bearer good-token') {
        const err = new Error('Authentication required');
        err.statusCode = 401;
        return next(err);
      }
      req.user = state.user;
      req.session = state.session;
      next();
    },
    authorizeRoles: (...roles) => (req, _res, next) => {
      if (!roles.includes(req.user.role)) {
        const err = new Error('Forbidden');
        err.statusCode = 403;
        return next(err);
      }
      next();
    },
  };

  require.cache[storePath] = fakeModule(storePath, store);
  require.cache[authPath] = fakeModule(authPath, auth);
  require.cache[dbPath] = fakeModule(dbPath, {
    getHealth: async () => options.health || { status: 'healthy', database: 'connected' },
  });

  return { app: require('./app').createApp(), state };
}

function fakeModule(filename, exports) {
  return { id: filename, filename, loaded: true, exports };
}

async function request(app, method, path, options = {}) {
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const { port } = server.address();
    const body = options.body == null ? null : JSON.stringify(options.body);

    return await new Promise((resolve, reject) => {
      const req = http.request(
        {
          method,
          port,
          path,
          host: '127.0.0.1',
          agent: false,
          headers: {
            ...(body ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } : {}),
            connection: 'close',
            ...(options.headers || {}),
          },
        },
        (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            const contentType = res.headers['content-type'] || '';
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: text && contentType.includes('application/json') ? JSON.parse(text) : text || null,
            });
          });
        }
      );
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
}

const authHeader = { authorization: 'Bearer good-token' };

test('health endpoint reports healthy and degraded database states', async () => {
  let loaded = loadAppWithMocks();
  let res = await request(loaded.app, 'GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');

  loaded = loadAppWithMocks({ health: { status: 'unhealthy', database: 'disconnected' } });
  res = await request(loaded.app, 'GET', '/api/health');
  assert.equal(res.status, 503);
  assert.equal(res.body.status, 'degraded');
});

test('production middleware emits security headers and redirects forwarded HTTP', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const { app } = loadAppWithMocks();

    let res = await request(app, 'GET', '/api/health', {
      headers: { 'x-forwarded-proto': 'https' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers['strict-transport-security'], 'max-age=31536000; includeSubDomains');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['x-request-id']);

    res = await request(app, 'GET', '/api/health', {
      headers: {
        host: 'scout-report.azurewebsites.net',
        'x-forwarded-proto': 'http',
      },
    });
    assert.equal(res.status, 308);
    assert.equal(res.headers.location, 'https://scout-report.azurewebsites.net/api/health');
  } finally {
    if (previousNodeEnv == null) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
});

test('auth endpoints cover register login me and logout', async () => {
  const { app, state } = loadAppWithMocks();

  let res = await request(app, 'POST', '/auth/register', {
    body: { email: 'new@example.com', name: 'New User', password: 'StrongPass123' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, 'new@example.com');

  res = await request(app, 'POST', '/auth/login', {
    body: { email: 'scout@example.com', password: 'StrongPass123' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.token, 'token');

  res = await request(app, 'GET', '/auth/me', { headers: authHeader });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.id, 'user-1');

  res = await request(app, 'POST', '/auth/logout', { headers: authHeader });
  assert.equal(res.status, 204);
  assert.ok(state.calls.some((call) => call.name === 'logoutSession'));
});

test('reference endpoints return data and variety misses return 404', async () => {
  const { app } = loadAppWithMocks();

  let res = await request(app, 'GET', '/farms');
  assert.equal(res.status, 200);
  assert.equal(res.body[0].id, 'FARM-001');

  res = await request(app, 'GET', '/crop-types/CROP-001/varieties');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.varieties, ['Cherry Tomato']);

  res = await request(app, 'GET', '/crop-types/missing/varieties');
  assert.equal(res.status, 404);
});

test('protected report routes require authentication and pass filters to store', async () => {
  const { app, state } = loadAppWithMocks();

  let res = await request(app, 'GET', '/scout-reports');
  assert.equal(res.status, 401);

  res = await request(app, 'GET', '/scout-reports?status=Completed&limit=5', { headers: authHeader });
  assert.equal(res.status, 200);
  assert.equal(res.body[0].id, 'SR-000001');
  assert.equal(state.calls.find((call) => call.name === 'getReports').filters.status, 'Completed');
});

test('role-based routes allow admins and reject scouts', async () => {
  let loaded = loadAppWithMocks();
  let res = await request(loaded.app, 'GET', '/scout-reports/stats', { headers: authHeader });
  assert.equal(res.status, 403);

  loaded = loadAppWithMocks({ user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' } });
  res = await request(loaded.app, 'GET', '/scout-reports/stats', { headers: authHeader });
  assert.equal(res.status, 200);
  assert.equal(res.body.totalReports, 1);

  res = await request(loaded.app, 'DELETE', '/scout-reports/SR-000001', { headers: authHeader });
  assert.equal(res.status, 204);
});

test('report controller endpoints cover create update observations delete and not-found edges', async () => {
  const { app } = loadAppWithMocks({ user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' } });

  let res = await request(app, 'POST', '/scout-reports', {
    headers: authHeader,
    body: { farmId: 'FARM-001', cropType: 'Tomato' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.id, 'SR-000002');

  res = await request(app, 'GET', '/scout-reports/missing', { headers: authHeader });
  assert.equal(res.status, 404);

  res = await request(app, 'PATCH', '/scout-reports/missing', {
    headers: authHeader,
    body: { weather: 'Cloudy' },
  });
  assert.equal(res.status, 404);

  res = await request(app, 'POST', '/scout-reports/SR-000001/pest-observations', {
    headers: authHeader,
    body: { pestType: 'Whitefly' },
  });
  assert.equal(res.status, 201);

  res = await request(app, 'POST', '/scout-reports/missing/disease-observations', {
    headers: authHeader,
    body: { diseaseType: 'Early Blight' },
  });
  assert.equal(res.status, 404);

  res = await request(app, 'DELETE', '/scout-reports/missing', { headers: authHeader });
  assert.equal(res.status, 404);
});

test('controller errors return safe client responses', async () => {
  const validationError = new Error('Invalid status filter');
  validationError.statusCode = 400;
  let loaded = loadAppWithMocks({ getReportsError: validationError });
  let res = await request(loaded.app, 'GET', '/scout-reports?status=Nope', { headers: authHeader });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Invalid status filter');

  const originalError = console.error;
  console.error = () => {};
  try {
    loaded = loadAppWithMocks({ saveReportError: new Error('database exploded') });
    res = await request(loaded.app, 'POST', '/scout-reports', {
      headers: authHeader,
      body: { farmId: 'FARM-001', cropType: 'Tomato' },
    });
    assert.equal(res.status, 500);
    assert.equal(res.body.error, 'Internal server error');
  } finally {
    console.error = originalError;
  }
});
