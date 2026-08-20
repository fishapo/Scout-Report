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
  [
    './app',
    './store',
    './auth',
    './db',
    './routes',
    './routes/auth.routes',
    './routes/health.routes',
    './routes/reference.routes',
    './routes/report.routes',
    './routes/dashboard.routes',
    './routes/workflow.routes',
    './controllers/workflow.controller',
    './controllers/auth.controller',
    './controllers/reference.controller',
    './controllers/report.controller',
    './controllers/dashboard.controller',
    './dashboard',
  ].forEach((modulePath) => delete require.cache[require.resolve(modulePath)]);

  const storePath = require.resolve('./store');
  const authPath = require.resolve('./auth');
  const dbPath = require.resolve('./db');
  const dashboardPath = require.resolve('./dashboard');
  const pageAuthPath = require.resolve('./middleware/requirePageAuth');

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
        ownerId: 'user-1',
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
    getCropVarieties: async (id) => (id === 'CROP-001' ? ['Cherry Tomato'] : []),
    getReports: async (filters, user) => {
      state.calls.push({ name: 'getReports', filters, user });
      if (options.getReportsError) throw options.getReportsError;
      if (!user || user.role === 'admin') return state.reports;
      return state.reports.filter((report) => report.ownerId === user.id);
    },
    getStats: async (filters) => {
      state.calls.push({ name: 'getStats', filters });
      return { totalReports: 1, criticalIssues: 0, activeFarms: 1, responseRate: 100 };
    },
    findReport: async (id, _client, user) => {
      state.calls.push({ name: 'findReport', id, user });
      const report = state.reports.find((item) => item.id === id) || null;
      if (!report) return null;
      if (!user || user.role === 'admin') return report;
      return report.ownerId === user.id ? report : null;
    },
    saveReport: async (body, user) => {
      state.calls.push({ name: 'saveReport', body, user });
      if (options.saveReportError) throw options.saveReportError;
      return { id: 'SR-000002', ...body, status: 'Completed', ownerId: user?.id || 'user-1' };
    },
    updateReport: async (id, body, user) => {
      state.calls.push({ name: 'updateReport', id, body, user });
      if (id === 'missing') return null;
      const report = state.reports.find((item) => item.id === id);
      if (!report) return null;
      if (user && user.role !== 'admin' && report.ownerId !== user.id) return null;
      return { ...report, ...body, id };
    },
    addPestObservation: async (id, body, user) => {
      state.calls.push({ name: 'addPestObservation', id, body, user });
      if (id === 'missing') return null;
      const report = state.reports.find((item) => item.id === id);
      if (!report) return null;
      if (user && user.role !== 'admin' && report.ownerId !== user.id) return null;
      return { ...report, id, pestObservations: [body] };
    },
    addDiseaseObservation: async (id, body, user) => {
      state.calls.push({ name: 'addDiseaseObservation', id, body, user });
      if (id === 'missing') return null;
      const report = state.reports.find((item) => item.id === id);
      if (!report) return null;
      if (user && user.role !== 'admin' && report.ownerId !== user.id) return null;
      return { ...report, id, diseaseObservations: [body] };
    },
    deleteReport: async (id, user) => {
      state.calls.push({ name: 'deleteReport', id, user });
      if (id === 'missing') return false;
      const report = state.reports.find((item) => item.id === id);
      if (!report) return false;
      if (user && user.role !== 'admin' && report.ownerId !== user.id) return false;
      return true;
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
      const bearer = req.get('authorization');
      const cookie = req.cookies?.access_token;
      const valid = bearer === 'Bearer good-token' || cookie === 'good-cookie';
      if (state.authRequired && !valid) {
        const err = new Error('Authentication required');
        err.statusCode = 401;
        return next(err);
      }
      if (cookie === 'expired-cookie' || cookie === 'invalid-cookie' || bearer === 'Bearer expired-token') {
        const err = new Error('Invalid or expired session');
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
  delete require.cache[pageAuthPath];
  require.cache[dbPath] = fakeModule(dbPath, {
    getHealth: async () => options.health || { status: 'healthy', database: 'connected' },
  });
  require.cache[dashboardPath] = fakeModule(dashboardPath, {
    snapshot: async (user) => ({ role: user.role, totals: { total_reports: 4, critical: 1, completed: 2, pending: 1 } }),
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

test('web client is served from the application root', async () => {
  const { app } = loadAppWithMocks();
  const res = await request(app, 'GET', '/');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/html/);
});

test('browser routing sends scouts to scout dashboard and protects scout pages', async () => {
  const { app } = loadAppWithMocks();

  let res = await request(app, 'GET', '/dashboard', { headers: authHeader });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/scout-dashboard');

  res = await request(app, 'GET', '/scout-dashboard', { headers: authHeader });
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/html/);

  res = await request(app, 'GET', '/scout-form', { headers: authHeader });
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/html/);

  res = await request(app, 'GET', '/scout-dashboard');
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/login');
});

test('browser routing sends workflow roles to their verification dashboards', async () => {
  let loaded = loadAppWithMocks({ user: { id: 'supervisor-1', email: 'supervisor@example.com', role: 'inter_farm_supervisor' } });
  let res = await request(loaded.app, 'GET', '/dashboard', { headers: authHeader });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/inter-farm-supervisor-dashboard');

  res = await request(loaded.app, 'GET', '/inter-farm-supervisor-dashboard', { headers: authHeader });
  assert.equal(res.status, 200);

  loaded = loadAppWithMocks({ user: { id: 'hod-1', email: 'hod@example.com', role: 'head_of_department' } });
  res = await request(loaded.app, 'GET', '/dashboard', { headers: authHeader });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/head-of-department-dashboard');

  res = await request(loaded.app, 'GET', '/head-of-department-dashboard', { headers: authHeader });
  assert.equal(res.status, 200);
});

test('browser routing sends admins to admin dashboard and blocks admin page for scouts', async () => {
  let loaded = loadAppWithMocks({ user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' } });
  let res = await request(loaded.app, 'GET', '/dashboard', { headers: authHeader });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/admin-dashboard.html');

  res = await request(loaded.app, 'GET', '/admin-dashboard.html', { headers: authHeader });
  assert.equal(res.status, 200);

  loaded = loadAppWithMocks();
  res = await request(loaded.app, 'GET', '/admin-dashboard.html', { headers: authHeader });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/dashboard');
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

test('authentication attempts are throttled after repeated failures', async () => {
  const { app } = loadAppWithMocks();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const res = await request(app, 'POST', '/auth/login', {
      body: { email: 'scout@example.com', password: 'StrongPass123' },
    });
    assert.equal(res.status, 200);
  }

  const blocked = await request(app, 'POST', '/auth/login', {
    body: { email: 'scout@example.com', password: 'StrongPass123' },
  });
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers['retry-after']);
});

test('reference endpoints return data and variety misses return 404', async () => {
  const { app } = loadAppWithMocks();

  let res = await request(app, 'GET', '/api/reference');
  assert.equal(res.status, 200);
  assert.equal(res.body.farms[0].id, 'FARM-001');

  res = await request(app, 'GET', '/farms');
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

  res = await request(app, 'GET', '/auth/me');
  assert.equal(res.status, 401);

  res = await request(app, 'POST', '/auth/logout');
  assert.equal(res.status, 401);

  res = await request(app, 'GET', '/scout-reports?status=Completed&limit=5', { headers: authHeader });
  assert.equal(res.status, 200);
  assert.equal(res.body[0].id, 'SR-000001');
  assert.equal(state.calls.find((call) => call.name === 'getReports').filters.status, 'Completed');
});

test('authentication regression covers cookie and bearer credentials', async () => {
  const loaded = loadAppWithMocks();

  let res = await request(loaded.app, 'GET', '/auth/me', { headers: authHeader });
  assert.equal(res.status, 200);

  res = await request(loaded.app, 'GET', '/auth/me', { headers: { cookie: 'access_token=good-cookie' } });
  assert.equal(res.status, 200);
});

test('authentication regression rejects expired and invalid sessions', async () => {
  const loaded = loadAppWithMocks();

  let res = await request(loaded.app, 'GET', '/api/dashboard', { headers: { cookie: 'access_token=expired-cookie' } });
  assert.equal(res.status, 401);

  res = await request(loaded.app, 'GET', '/api/dashboard', { headers: { authorization: 'Bearer expired-token' } });
  assert.equal(res.status, 401);

  res = await request(loaded.app, 'GET', '/api/dashboard', { headers: { cookie: 'access_token=invalid-cookie' } });
  assert.equal(res.status, 401);
});

test('all four roles can access the shared API dashboard', async () => {
  for (const role of ['scout', 'inter_farm_supervisor', 'head_of_department', 'admin']) {
    const loaded = loadAppWithMocks({ user: { id: `${role}-1`, email: `${role}@example.com`, role } });
    const res = await request(loaded.app, 'GET', '/api/dashboard', { headers: authHeader });
    assert.equal(res.status, 200, role);
    assert.equal(res.body.dashboard.role, role);
  }
});

test('browser authentication redirects unauthenticated requests to login', async () => {
  const loaded = loadAppWithMocks();
  let res = await request(loaded.app, 'GET', '/dashboard');
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/login');

  res = await request(loaded.app, 'GET', '/dashboard', { headers: { cookie: 'access_token=expired-cookie' } });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/login');
});

test('browser dashboard routing supports all four roles', async () => {
  const expected = {
    scout: '/scout-dashboard',
    inter_farm_supervisor: '/inter-farm-supervisor-dashboard',
    head_of_department: '/head-of-department-dashboard',
    admin: '/admin-dashboard.html',
  };
  for (const [role, destination] of Object.entries(expected)) {
    const loaded = loadAppWithMocks({ user: { id: `${role}-1`, email: `${role}@example.com`, role } });
    const res = await request(loaded.app, 'GET', '/dashboard', { headers: { cookie: 'access_token=good-cookie' } });
    assert.equal(res.status, 302, role);
    assert.equal(res.headers.location, destination, role);
  }
});

test('protected report endpoints return 401 without authentication', async () => {
  const loaded = loadAppWithMocks();
  const paths = [
    ['/api/reports', 'GET'],
    ['/api/reports', 'POST'],
    ['/scout-reports', 'GET'],
  ];
  for (const [path, method] of paths) {
    const res = await request(loaded.app, method, path);
    assert.equal(res.status, 401, `${method} ${path}`);
  }
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

test('scouts only access reports they own while admins retain full access', async () => {
  const { app, state } = loadAppWithMocks({
    reports: [
      {
        id: 'SR-000001',
        farmId: 'FARM-001',
        farmName: 'Green Valley Farm',
        cropType: 'Tomato',
        pestObservations: [],
        diseaseObservations: [],
        status: 'Completed',
        ownerId: 'user-1',
      },
      {
        id: 'SR-000002',
        farmId: 'FARM-001',
        farmName: 'Green Valley Farm',
        cropType: 'Tomato',
        pestObservations: [],
        diseaseObservations: [],
        status: 'Pending',
        ownerId: 'user-2',
      },
    ],
  });

  let res = await request(app, 'GET', '/scout-reports', { headers: authHeader });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.map((report) => report.id), ['SR-000001']);

  res = await request(app, 'GET', '/scout-reports/SR-000002', { headers: authHeader });
  assert.equal(res.status, 404);

  const adminLoaded = loadAppWithMocks({
    user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
    reports: state.reports,
  });
  res = await request(adminLoaded.app, 'GET', '/scout-reports/SR-000002', { headers: authHeader });
  assert.equal(res.status, 200);
  assert.equal(res.body.id, 'SR-000002');
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
