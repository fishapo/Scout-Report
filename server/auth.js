/**
 * ============================================================
 * Scout Report API
 * ============================================================
 *
 * File:
 * server/auth.js
 *
 * Authentication Service
 *
 * Responsibilities:
 * - User registration
 * - User login
 * - Password hashing
 * - Session management
 * - JWT creation and validation
 * - Authentication middleware
 * - Role authorization
 *
 * IMPORTANT:
 * This module uses ONE authentication/session model only:
 *
 *   users + user_sessions + JWT(session id)
 *
 * There is deliberately NO legacy `sessions` table and no token
 * column lookup. The database schema in server/migrations/init.sql
 * defines `user_sessions` as the canonical session store.
 *
 * ============================================================
 */

"use strict";

const crypto = require("crypto");
const { query } = require("./db");

// ============================================================
// Configuration
// ============================================================

const HASH_ALGORITHM = "sha256";
const HASH_ITERATIONS = 310000;
const HASH_KEY_LENGTH = 32;

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 8;
const configuredTtl = Number(process.env.JWT_TTL_SECONDS);
const ACCESS_TOKEN_TTL_SECONDS =
    Number.isFinite(configuredTtl) && configuredTtl > 0
        ? Math.floor(configuredTtl)
        : DEFAULT_ACCESS_TOKEN_TTL_SECONDS;

const TOKEN_COOKIE_NAME = "access_token";

const VALID_ROLES = new Set([
    "admin",
    "scout",
    "inter_farm_supervisor",
    "head_of_department"
]);

// ============================================================
// Error
// ============================================================

class AuthError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = "AuthError";
        this.statusCode = statusCode;
    }
}

// ============================================================
// Registration
// ============================================================

async function registerUser(input, options = {}) {
    const payload = normalizeRegistration(input);

    return withAuthErrors(async () => {
        const role = await resolveRegistrationRole(
            payload.role,
            options.currentUser
        );

        const passwordHash = await hashPassword(payload.password);
        const now = new Date();
        const id = crypto.randomUUID();

        const result = await query(
            `
            INSERT INTO users
            (
                id,
                email,
                name,
                password_hash,
                role,
                is_active,
                created_at,
                updated_at
            )
            VALUES ($1, $2, $3, $4, $5, true, $6, $7)
            RETURNING
                id,
                email,
                name,
                role,
                is_active,
                created_at,
                updated_at
            `,
            [
                id,
                payload.email,
                payload.name,
                passwordHash,
                role,
                now,
                now
            ]
        );

        const row = result.rows[0];
        if (!row) {
            throw new AuthError("User registration failed", 500);
        }

        const user = sanitizeUser(row);
        const session = await createSession(user.id);

        return {
            user,
            token: signAccessToken(user, session),
            expiresAt: session.expiresAt
        };
    });
}

// ============================================================
// Login
// ============================================================

async function loginUser(input) {
    const email = normalizeEmail(input?.email);
    const password =
        typeof input?.password === "string" ? input.password : "";

    if (!email || !password) {
        throw new AuthError("Email and password are required", 400);
    }

    return withAuthErrors(async () => {
        const result = await query(
            `
            SELECT
                id,
                email,
                name,
                password_hash,
                role,
                is_active,
                created_at,
                updated_at
            FROM users
            WHERE email=$1
            LIMIT 1
            `,
            [email]
        );

        const row = result.rows[0];

        if (!row || !row.is_active) {
            throw new AuthError("Invalid email or password", 401);
        }

        const valid = await verifyPassword(password, row.password_hash);

        if (!valid) {
            throw new AuthError("Invalid email or password", 401);
        }

        const user = sanitizeUser(row);

        // A login creates a fresh session and revokes any previous
        // active sessions for the same user.
        await query(
            `
            UPDATE user_sessions
            SET revoked_at=$1
            WHERE user_id=$2
              AND revoked_at IS NULL
            `,
            [new Date(), user.id]
        );

        const session = await createSession(user.id);

        return {
            user,
            token: signAccessToken(user, session),
            expiresAt: session.expiresAt
        };
    });
}

// ============================================================
// Logout
// ============================================================

async function logoutSession(sessionId) {
    assertSessionId(sessionId);

    await query(
        `
        UPDATE user_sessions
        SET revoked_at=$1
        WHERE id=$2
          AND revoked_at IS NULL
        `,
        [new Date(), sessionId]
    );
}

// ============================================================
// Token Authentication
// ============================================================

/**
 * Resolve a JWT to its live user session.
 *
 * The JWT is only the signed credential. The database session remains
 * authoritative, which means logout/revocation takes effect immediately.
 *
 * Returns null only for an explicitly empty token. Invalid/expired tokens
 * throw AuthError so Express middleware can return a proper 401 response.
 */
async function getUserForToken(token) {
    if (!token || typeof token !== "string") {
        return null;
    }

    const payload = verifyAccessToken(token);

    return withAuthErrors(async () => {
        const result = await query(
            `
            SELECT
                u.id,
                u.email,
                u.name,
                u.role,
                u.is_active,
                u.created_at,
                u.updated_at,
                s.id AS session_id,
                s.expires_at,
                s.revoked_at
            FROM user_sessions s
            JOIN users u ON u.id=s.user_id
            WHERE s.id=$1
              AND u.id=$2
            LIMIT 1
            `,
            [payload.sid, payload.sub]
        );

        const row = result.rows[0];

        if (
            !row ||
            !row.is_active ||
            row.revoked_at ||
            !isValidDate(row.expires_at) ||
            new Date(row.expires_at) <= new Date()
        ) {
            throw new AuthError("Invalid or expired session", 401);
        }

        await query(
            `
            UPDATE user_sessions
            SET last_seen_at=$1
            WHERE id=$2
            `,
            [new Date(), row.session_id]
        );

        return {
            user: sanitizeUser(row),
            session: {
                id: row.session_id,
                expiresAt: formatTimestamp(row.expires_at)
            }
        };
    });
}

// ============================================================
// User Lookup
// ============================================================

async function getUserById(id) {
    if (typeof id !== "string" || !id.trim()) {
        return null;
    }

    const result = await query(
        `
        SELECT
            id,
            email,
            name,
            role,
            is_active,
            created_at,
            updated_at
        FROM users
        WHERE id=$1
        LIMIT 1
        `,
        [id]
    );

    return result.rows[0] ? sanitizeUser(result.rows[0]) : null;
}

// ============================================================
// Express Middleware
// ============================================================

function authenticate(req, _res, next) {
    try {
        const token = extractToken(req);

        if (!token) {
            return next(new AuthError("Authentication required", 401));
        }

        getUserForToken(token)
            .then(({ user, session }) => {
                req.user = user;
                req.session = session;
                next();
            })
            .catch(next);
    } catch (error) {
        next(error);
    }
}

function authorizeRoles(...roles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new AuthError("Authentication required", 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AuthError("Forbidden", 403));
        }

        next();
    };
}

function extractToken(req) {
    const header =
        typeof req?.get === "function"
            ? req.get("authorization") || ""
            : req?.headers?.authorization || "";

    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (match) {
        return match[1].trim();
    }

    const cookieToken = req?.cookies?.[TOKEN_COOKIE_NAME];
    return typeof cookieToken === "string" && cookieToken.trim()
        ? cookieToken.trim()
        : null;
}

// ============================================================
// Session Creation
// ============================================================

async function createSession(userId) {
    if (typeof userId !== "string" || !userId.trim()) {
        throw new AuthError("User id required", 400);
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(
        now.getTime() + ACCESS_TOKEN_TTL_SECONDS * 1000
    );

    await query(
        `
        INSERT INTO user_sessions
        (
            id,
            user_id,
            expires_at,
            created_at,
            last_seen_at
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [id, userId, expiresAt, now, now]
    );

    return {
        id,
        expiresAt: expiresAt.toISOString()
    };
}

// ============================================================
// JWT
// ============================================================

function signAccessToken(user, session) {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = new Date(session.expiresAt);

    if (!isValidDate(expiresAt)) {
        throw new AuthError("Invalid session expiry", 500);
    }

    return signJwt({
        sub: user.id,
        email: user.email,
        role: user.role,
        sid: session.id,
        iat: now,
        exp: Math.floor(expiresAt.getTime() / 1000)
    });
}

function signJwt(payload) {
    const header = {
        alg: "HS256",
        typ: "JWT"
    };

    const encodedHeader = encodeBase64UrlJson(header);
    const encodedPayload = encodeBase64UrlJson(payload);
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = signJwtInput(signingInput);

    return `${signingInput}.${signature}`;
}

function verifyAccessToken(token) {
    if (typeof token !== "string" || !token.trim()) {
        throw new AuthError("Invalid token", 401);
    }

    const parts = token.split(".");

    if (parts.length !== 3 || parts.some(part => !part)) {
        throw new AuthError("Invalid token", 401);
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = signJwtInput(
        `${encodedHeader}.${encodedPayload}`
    );

    if (!safeEqual(signature, expectedSignature)) {
        throw new AuthError("Invalid token", 401);
    }

    const decodedHeader = decodeBase64UrlJson(encodedHeader);

    if (
        decodedHeader.alg !== "HS256" ||
        decodedHeader.typ !== "JWT"
    ) {
        throw new AuthError("Invalid token", 401);
    }

    const decoded = decodeBase64UrlJson(encodedPayload);

    if (
        typeof decoded.sub !== "string" ||
        !decoded.sub ||
        typeof decoded.sid !== "string" ||
        !decoded.sid ||
        !Number.isInteger(decoded.exp)
    ) {
        throw new AuthError("Invalid token", 401);
    }

    if (decoded.exp <= Math.floor(Date.now() / 1000)) {
        throw new AuthError("Token expired", 401);
    }

    if (
        decoded.iat !== undefined &&
        (!Number.isInteger(decoded.iat) || decoded.iat > Math.floor(Date.now() / 1000) + 60)
    ) {
        throw new AuthError("Invalid token", 401);
    }

    return decoded;
}

// ============================================================
// Password Hashing
// ============================================================

async function hashPassword(password) {
    if (typeof password !== "string" || !password) {
        throw new AuthError("Password required", 400);
    }

    const salt = crypto.randomBytes(16).toString("base64url");
    const hash = await pbkdf2(
        password,
        salt,
        HASH_ITERATIONS,
        HASH_KEY_LENGTH,
        HASH_ALGORITHM
    );

    return [
        `pbkdf2_${HASH_ALGORITHM}`,
        HASH_ITERATIONS,
        salt,
        hash.toString("base64url")
    ].join("$");
}

async function verifyPassword(password, storedHash) {
    if (typeof password !== "string") {
        return false;
    }

    const parts = String(storedHash || "").split("$");

    if (parts.length !== 4) {
        return false;
    }

    const [algorithmLabel, iterationsText, salt, hashText] = parts;
    const algorithm = algorithmLabel.replace(/^pbkdf2_/, "");
    const iterations = Number(iterationsText);

    if (
        algorithm !== HASH_ALGORITHM ||
        !Number.isInteger(iterations) ||
        iterations <= 0 ||
        !salt ||
        !hashText
    ) {
        return false;
    }

    let expected;
    try {
        expected = Buffer.from(hashText, "base64url");
    } catch (_error) {
        return false;
    }

    if (!expected.length) {
        return false;
    }

    const actual = await pbkdf2(
        password,
        salt,
        iterations,
        expected.length,
        algorithm
    );

    return safeEqual(expected, actual);
}

function pbkdf2(password, salt, iterations, keyLength, digest) {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(
            password,
            salt,
            iterations,
            keyLength,
            digest,
            (err, key) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(key);
                }
            }
        );
    });
}

// ============================================================
// Registration Helpers
// ============================================================

function normalizeRegistration(input) {
    if (!input || typeof input !== "object") {
        throw new AuthError("Registration payload required");
    }

    const email = normalizeEmail(input.email);
    if (!email) {
        throw new AuthError("Valid email required");
    }

    const password =
        typeof input.password === "string" ? input.password : "";

    validatePassword(password);

    return {
        email,
        name: String(input.name || "").trim(),
        password,
        role: input.role || "scout"
    };
}

function validatePassword(password) {
    if (password.length < 8) {
        throw new AuthError("Password must be at least 8 characters");
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        throw new AuthError(
            "Password must contain letters and numbers"
        );
    }
}

function normalizeEmail(value) {
    if (typeof value !== "string") {
        return "";
    }

    const email = value.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

async function resolveRegistrationRole(role, currentUser) {
    const result = await query(
        "SELECT COUNT(*)::int count FROM users"
    );

    const firstUser = Number(result.rows[0]?.count || 0) === 0;

    if (firstUser) {
        return "admin";
    }

    if (!VALID_ROLES.has(role)) {
        throw new AuthError("Invalid role", 400);
    }

    if (
        role !== "scout" &&
        (!currentUser || currentUser.role !== "admin")
    ) {
        throw new AuthError("Only admins can assign elevated roles", 403);
    }

    return role;
}

// ============================================================
// Data / Crypto Helpers
// ============================================================

function sanitizeUser(row) {
    return {
        id: row?.id,
        email: row?.email,
        name: row?.name,
        role: row?.role,
        isActive: Boolean(row?.is_active),
        createdAt: formatTimestamp(row?.created_at),
        updatedAt: formatTimestamp(row?.updated_at)
    };
}

function formatTimestamp(value) {
    return isValidDate(value) ? new Date(value).toISOString() : null;
}

function isValidDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    return !Number.isNaN(date.getTime());
}

function signJwtInput(input) {
    return crypto
        .createHmac("sha256", getJwtSecret())
        .update(input)
        .digest("base64url");
}

function getJwtSecret() {
    const secret =
        process.env.JWT_SECRET || "development-only-change-me";

    if (
        process.env.NODE_ENV === "production" &&
        secret === "development-only-change-me"
    ) {
        throw new AuthError("JWT_SECRET required", 500);
    }

    return secret;
}

function encodeBase64UrlJson(value) {
    return Buffer
        .from(JSON.stringify(value))
        .toString("base64url");
}

function decodeBase64UrlJson(value) {
    try {
        if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
            throw new Error("Invalid base64url value");
        }

        return JSON.parse(
            Buffer.from(value, "base64url").toString("utf8")
        );
    } catch (_error) {
        throw new AuthError("Invalid token", 401);
    }
}

function safeEqual(a, b) {
    const x = Buffer.from(a);
    const y = Buffer.from(b);

    return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function assertSessionId(value) {
    if (typeof value !== "string" || !value.trim()) {
        throw new AuthError("Session id required");
    }
}

async function withAuthErrors(fn) {
    try {
        return await fn();
    } catch (error) {
        if (error instanceof AuthError) {
            throw error;
        }

        if (error?.code === "23505") {
            throw new AuthError("Email already registered", 409);
        }

        throw error;
    }
}

// ============================================================
// Exports
// ============================================================

module.exports = {
    AuthError,
    authenticate,
    authorizeRoles,
    getUserForToken,
    getUserById,
    hashPassword,
    loginUser,
    logoutSession,
    registerUser,
    signJwt,
    verifyAccessToken,
    verifyPassword,
    extractToken
};
