const { test } = require('node:test');
const assert = require('node:assert');

function loadAuthWithMockDb(seed = {}) {
  const dbPath = require.resolve('./db');
  const authPath = require.resolve('./auth');

  delete require.cache[authPath];
  delete require.cache[dbPath];

  const state = {
    users: seed.users || [],
    sessions: seed.sessions || [],
  };

  async function runQuery(text, params = []) {
    const sql = text.replace(/\s+/g, ' ').trim();

    if (sql.startsWith('SELECT COUNT(*)::int AS count FROM users')) {
      return rows([{ count: state.users.length }]);
    }

    if (sql.startsWith('INSERT INTO users')) {
      const [id, email, name, passwordHash, role, createdAt, updatedAt] = params;
      if (state.users.some((user) => user.email === email)) {
        const err = new Error('duplicate key');
        err.code = '23505';
        throw err;
      }
      const user = {
        id,
        email,
        name,
        password_hash: passwordHash,
        role,
        is_active: true,
        created_at: createdAt,
        updated_at: updatedAt,
      };
      state.users.push(user);
      return rows([user]);
    }

    if (sql.startsWith('SELECT id, email, name, password_hash')) {
      const user = state.users.find((item) => item.email === params[0]);
      return rows(user ? [user] : []);
    }

    if (sql.startsWith('INSERT INTO user_sessions')) {
      const [id, userId, expiresAt, createdAt, lastSeenAt] = params;
      state.sessions.push({
        id,
        user_id: userId,
        expires_at: expiresAt,
        revoked_at: null,
        created_at: createdAt,
        last_seen_at: lastSeenAt,
      });
      return result(1);
    }

    if (sql.startsWith('SELECT u.id, u.email')) {
      const [sessionId, userId] = params;
      const session = state.sessions.find((item) => item.id === sessionId && item.user_id === userId);
      if (!session) return rows([]);
      const user = state.users.find((item) => item.id === userId);
      if (!user) return rows([]);
      return rows([
        {
          ...user,
          session_id: session.id,
          expires_at: session.expires_at,
          revoked_at: session.revoked_at,
        },
      ]);
    }

    if (sql.startsWith('UPDATE user_sessions SET last_seen_at')) {
      const [lastSeenAt, sessionId] = params;
      const session = state.sessions.find((item) => item.id === sessionId);
      if (session) session.last_seen_at = lastSeenAt;
      return result(session ? 1 : 0);
    }

    if (sql.startsWith('UPDATE user_sessions SET revoked_at')) {
      const [revokedAt, sessionId] = params;
      const session = state.sessions.find((item) => item.id === sessionId && !item.revoked_at);
      if (session) session.revoked_at = revokedAt;
      return result(session ? 1 : 0);
    }

    throw new Error(`Unhandled SQL in auth test mock: ${sql}`);
  }

  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      query: runQuery,
    },
  };

  return { auth: require('./auth'), state };
}

function result(rowCount, resultRows = []) {
  return { rowCount, rows: resultRows };
}

function rows(resultRows) {
  return result(resultRows.length, resultRows);
}

test('hashPassword stores a non-plaintext hash and verifyPassword validates it', async () => {
  const { auth } = loadAuthWithMockDb();

  const hash = await auth.hashPassword('StrongPass123');

  assert.notEqual(hash, 'StrongPass123');
  assert.match(hash, /^pbkdf2_sha256\$/);
  assert.equal(await auth.verifyPassword('StrongPass123', hash), true);
  assert.equal(await auth.verifyPassword('WrongPass123', hash), false);
});

test('registerUser creates the first user as admin and rejects weak passwords', async () => {
  const { auth, state } = loadAuthWithMockDb();

  await assert.rejects(
    () => auth.registerUser({ email: 'bad@example.com', name: 'Bad', password: 'weak' }),
    /Password must be at least 8 characters/
  );

  const result = await auth.registerUser({
    email: 'ADMIN@Example.com',
    name: 'Admin User',
    password: 'StrongPass123',
  });

  assert.equal(result.user.email, 'admin@example.com');
  assert.equal(result.user.role, 'admin');
  assert.ok(result.token);
  assert.equal(state.users.length, 1);
  assert.equal(state.sessions.length, 1);
});

test('loginUser issues a JWT-backed session and logout revokes it', async () => {
  const { auth, state } = loadAuthWithMockDb();
  const passwordHash = await auth.hashPassword('StrongPass123');
  state.users.push({
    id: 'user-1',
    email: 'scout@example.com',
    name: 'Scout User',
    password_hash: passwordHash,
    role: 'scout',
    is_active: true,
    created_at: new Date('2026-06-29T08:00:00.000Z'),
    updated_at: new Date('2026-06-29T08:00:00.000Z'),
  });

  await assert.rejects(
    () => auth.loginUser({ email: 'scout@example.com', password: 'WrongPass123' }),
    /Invalid email or password/
  );

  const login = await auth.loginUser({ email: 'scout@example.com', password: 'StrongPass123' });
  const authenticated = await auth.getUserForToken(login.token);

  assert.equal(authenticated.user.id, 'user-1');
  assert.equal(authenticated.user.role, 'scout');

  await auth.logoutSession(authenticated.session.id);
  await assert.rejects(() => auth.getUserForToken(login.token), /Invalid or expired session/);
});

test('authorizeRoles rejects authenticated users without the required role', async () => {
  const { auth } = loadAuthWithMockDb();
  const middleware = auth.authorizeRoles('admin');
  const req = { user: { role: 'scout' } };

  await new Promise((resolve) => {
    middleware(req, {}, (err) => {
      assert.equal(err.statusCode, 403);
      resolve();
    });
  });
});
