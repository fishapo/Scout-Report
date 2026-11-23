# 5. Security and Authorization Plan

## Existing security mechanism

The project already has the correct primitives:

- JWT access token
- revocable user session
- `auth.authenticate`
- `auth.authorizeRoles`
- `admin` role
- `scout` role

The admin CRUD implementation should reuse them.

## Required request flow

```text
HTTP request
  ↓
auth.authenticate
  ↓
req.user
  ↓
auth.authorizeRoles("admin")
  ↓
controller
```

## Required outcomes

### Anonymous

```http
POST /api/admin/reference/farms
→ 401
```

### Scout

```http
POST /api/admin/reference/farms
Authorization: Bearer <scout-token>
→ 403
```

### Admin

```http
POST /api/admin/reference/farms
Authorization: Bearer <admin-token>
→ 201
```

## Do not rely on UI hiding

The browser must hide/disable CRUD controls for non-admin users, but this is only UX.

The server remains authoritative.

## Existing page protection

`/admin-dashboard.html` already requires:

- authentication
- admin role

The new CRUD endpoints need their own API authorization because a client can call them without using the page.

## CSRF/session considerations

The project supports access-token cookies and Bearer tokens.

Before production rollout, verify the cookie attributes and whether browser mutation requests rely on cookies. If cookies are the normal browser credential, add a deliberate CSRF strategy for state-changing endpoints rather than assuming SameSite alone is sufficient.

Do not introduce CSRF middleware blindly into the current phase without testing the existing login/logout flow.

## Audit logging

Recommended before production:

- actor user ID
- actor email
- role
- action
- entity type
- entity ID
- timestamp
- old value
- new value
- request ID

Audit logging can be implemented after CRUD correctness if time is constrained, but should be part of the production readiness gate.
