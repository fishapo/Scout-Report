const crypto = require('crypto');
const { query } = require('./db');

const HASH_ALGORITHM = 'sha256';
const HASH_ITERATIONS = 310000;
const HASH_KEY_LENGTH = 32;
const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS || 60 * 60 * 8);
const VALID_ROLES = new Set(['admin', 'scout']);

class AuthError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

async function registerUser(input, options = {}) {
  const payload = normalizeRegistration(input);

  return withAuthErrors(async () => {
    const role = await resolveRegistrationRole(payload.role, options.currentUser);
    const passwordHash = await hashPassword(payload.password);
    const now = new Date();
    const id = crypto.randomUUID();

    const result = await query(
      `
        INSERT INTO users (id, email, name, password_hash, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, true, $6, $7)
        RETURNING id, email, name, role, is_active, created_at, updated_at
      `,
      [id, payload.email, payload.name, passwordHash, role, now, now]
    );

    const user = sanitizeUser(result.rows[0]);
    const session = await createSession(user.id);
    return {
      user,
      token: signAccessToken(user, session),
      expiresAt: session.expiresAt,
    };
  });
}

async function loginUser(input) {
  const email = normalizeEmail(input?.email);
  const password = typeof input?.password === 'string' ? input.password : '';

  if (!email || !password) throw new AuthError('Email and password are required', 400);

  return withAuthErrors(async () => {
    const result = await query(
      `
        SELECT id, email, name, password_hash, role, is_active, created_at, updated_at
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [email]
    );

    const userRow = result.rows[0];
    if (!userRow || !userRow.is_active) throw new AuthError('Invalid email or password', 401);

    const passwordOk = await verifyPassword(password, userRow.password_hash);
    if (!passwordOk) throw new AuthError('Invalid email or password', 401);

    const user = sanitizeUser(userRow);
    const session = await createSession(user.id);
    return {
      user,
      token: signAccessToken(user, session),
      expiresAt: session.expiresAt,
    };
  });
}

async function logoutSession(sessionId) {
  assertSessionId(sessionId);
  await query(
    `
      UPDATE user_sessions
      SET revoked_at = $1
      WHERE id = $2 AND revoked_at IS NULL
    `,
    [new Date(), sessionId]
  );
}

async function getUserForToken(token) {
  const payload = verifyAccessToken(token);

  return withAuthErrors(async () => {
    const result = await query(
      `
        SELECT
          u.id, u.email, u.name, u.role, u.is_active, u.created_at, u.updated_at,
          s.id AS session_id, s.expires_at, s.revoked_at
        FROM user_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.id = $1 AND u.id = $2
        LIMIT 1
      `,
      [payload.sid, payload.sub]
    );

    const row = result.rows[0];
    if (!row || !row.is_active || row.revoked_at || new Date(row.expires_at) <= new Date()) {
      throw new AuthError('Invalid or expired session', 401);
    }

    await query('UPDATE user_sessions SET last_seen_at = $1 WHERE id = $2', [new Date(), row.session_id]);

    return {
      user: sanitizeUser(row),
      session: {
        id: row.session_id,
        expiresAt: formatTimestamp(row.expires_at),
      },
    };
  });
}

function authenticate(req, _res, next) {
  const header = req.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return next(new AuthError('Authentication required', 401));

  getUserForToken(match[1])
    .then(({ user, session }) => {
      req.user = user;
      req.session = session;
      next();
    })
    .catch(next);
}

function authorizeRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AuthError('Authentication required', 401));
    if (!roles.includes(req.user.role)) return next(new AuthError('Forbidden', 403));
    next();
  };
}

async function createSession(userId) {
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ACCESS_TOKEN_TTL_SECONDS * 1000);

  await query(
    `
      INSERT INTO user_sessions (id, user_id, expires_at, created_at, last_seen_at)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [id, userId, expiresAt, now, now]
  );

  return { id, expiresAt: expiresAt.toISOString() };
}

async function resolveRegistrationRole(requestedRole, currentUser) {
  const requested = requestedRole || 'scout';
  if (!VALID_ROLES.has(requested)) throw new AuthError('Invalid role');

  const count = await query('SELECT COUNT(*)::int AS count FROM users');
  const isFirstUser = Number(count.rows[0]?.count || 0) === 0;
  if (isFirstUser) return 'admin';

  if (requested !== 'scout') {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new AuthError('Only admins can assign elevated roles', 403);
    }
  }

  return requested;
}

function normalizeRegistration(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AuthError('Registration payload must be an object');
  }

  const email = normalizeEmail(input.email);
  if (!email) throw new AuthError('Valid email is required');

  const name = optionalString(input.name);
  if (name.length < 2) throw new AuthError('Name must be at least 2 characters');

  const password = typeof input.password === 'string' ? input.password : '';
  validatePassword(password);

  return {
    email,
    name,
    password,
    role: optionalString(input.role) || 'scout',
  };
}

function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function validatePassword(password) {
  if (password.length < 8) throw new AuthError('Password must be at least 8 characters');
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AuthError('Password must include at least one letter and one number');
  }
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = await pbkdf2(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_ALGORITHM);
  return `pbkdf2_${HASH_ALGORITHM}$${HASH_ITERATIONS}$${salt}$${hash.toString('base64url')}`;
}

async function verifyPassword(password, storedHash) {
  const parts = String(storedHash || '').split('$');
  if (parts.length !== 4) return false;

  const [algorithmLabel, iterationsText, salt, hashText] = parts;
  const algorithm = algorithmLabel.replace('pbkdf2_', '');
  const iterations = Number(iterationsText);
  if (algorithm !== HASH_ALGORITHM || !Number.isInteger(iterations) || iterations < HASH_ITERATIONS) {
    return false;
  }

  const expected = Buffer.from(hashText, 'base64url');
  const actual = await pbkdf2(password, salt, iterations, expected.length, algorithm);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function pbkdf2(password, salt, iterations, keyLength, digest) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keyLength, digest, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

function signAccessToken(user, session) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    sid: session.id,
    iat: now,
    exp: Math.floor(new Date(session.expiresAt).getTime() / 1000),
  };

  return signJwt(payload);
}

function signJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = encodeBase64UrlJson(header);
  const encodedPayload = encodeBase64UrlJson(payload);
  const signature = signJwtInput(`${encodedHeader}.${encodedPayload}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyAccessToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new AuthError('Invalid token', 401);

  const [header, payload, signature] = parts;
  const expected = signJwtInput(`${header}.${payload}`);
  if (!safeEqual(signature, expected)) throw new AuthError('Invalid token', 401);

  const decodedHeader = decodeBase64UrlJson(header);
  if (decodedHeader.alg !== 'HS256' || decodedHeader.typ !== 'JWT') throw new AuthError('Invalid token', 401);

  const decodedPayload = decodeBase64UrlJson(payload);
  if (!decodedPayload.sub || !decodedPayload.sid || !decodedPayload.exp) {
    throw new AuthError('Invalid token', 401);
  }
  if (decodedPayload.exp <= Math.floor(Date.now() / 1000)) throw new AuthError('Token expired', 401);

  return decodedPayload;
}

function signJwtInput(input) {
  return crypto.createHmac('sha256', getJwtSecret()).update(input).digest('base64url');
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || 'development-only-change-me';
  if (process.env.NODE_ENV === 'production' && secret === 'development-only-change-me') {
    throw new AuthError('JWT_SECRET is required in production', 500);
  }
  return secret;
}

function encodeBase64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeBase64UrlJson(value) {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch (_err) {
    throw new AuthError('Invalid token', 401);
  }
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function sanitizeUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: Boolean(row.is_active),
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at),
  };
}

function assertSessionId(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AuthError('Session id is required');
  }
}

function optionalString(value) {
  if (value == null) return '';
  if (typeof value !== 'string') return String(value).trim();
  return value.trim();
}

function formatTimestamp(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

async function withAuthErrors(operation) {
  try {
    return await operation();
  } catch (err) {
    if (err instanceof AuthError) throw err;
    if (err.code === '23505') throw new AuthError('Email is already registered', 409);
    if (err.code === '23503') throw new AuthError('Referenced account does not exist');
    throw err;
  }
}

module.exports = {
  AuthError,
  authenticate,
  authorizeRoles,
  getUserForToken,
  hashPassword,
  loginUser,
  logoutSession,
  registerUser,
  signJwt,
  verifyAccessToken,
  verifyPassword,
};
