# Scout-Report

Combined scout reports for @LathyFlora — pest and disease monitoring for agricultural farms.

## Quick Start

```bash
npm install
npm start
```

Open [./previews/](./previews/) for the preview hub, or go directly to:

- [./previews/user-form.html](./previews/user-form.html) — Scout report submission form
- [./previews/admin-dashboard.html](./previews/admin-dashboard.html) — Admin dashboard

## API Endpoints

Authentication uses Bearer JWTs. Register or log in, then send:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a user. The first registered user becomes `admin`; later users default to `scout`. |
| POST | `/auth/login` | Log in and receive a JWT plus session expiry. |
| POST | `/auth/logout` | Revoke the current session. Requires authentication. |
| GET | `/auth/me` | Get the current authenticated user/session. |
| GET | `/farms` | List available farms |
| GET | `/crop-types` | List crop types |
| GET | `/crop-types/:id/varieties` | Varieties for a crop type |
| GET | `/pests` | List common pests |
| GET | `/diseases` | List common diseases |
| GET | `/scout-reports` | List reports. Requires authentication. Supports `farm`, `status`, `dateFrom`, `dateTo`, `limit`, `offset`. |
| GET | `/scout-reports/stats` | Dashboard statistics. Requires `admin`. |
| GET | `/scout-reports/:id` | Get a single report. Requires authentication. |
| POST | `/scout-reports` | Create a new scout report. Requires `admin` or `scout`. |
| PATCH | `/scout-reports/:id` | Update report fields. Requires `admin`. |
| POST | `/scout-reports/:id/pest-observations` | Add pest observation to a report. Requires `admin` or `scout`. |
| POST | `/scout-reports/:id/disease-observations` | Add disease observation to a report. Requires `admin` or `scout`. |
| DELETE | `/scout-reports/:id` | Delete a report. Requires `admin`. |

## Security

- Passwords are stored as PBKDF2-SHA256 hashes with per-password salts.
- JWTs are signed with HS256 and backed by database sessions so logout can revoke access.
- Set `JWT_SECRET` in production. The development fallback must not be used for deployed systems.
- Roles: `admin` can view stats, update, and delete reports; `scout` can create reports and add observations.

## Project Structure

```
Scout-Report/
├── previews/           # HTML UI (form, dashboard, preview hub)
├── server/
│   ├── index.js        # Express API server
│   ├── auth.js         # Authentication, password hashing, JWT, sessions, RBAC
│   ├── store.js        # PostgreSQL-backed report/reference store
│   └── migrations/
│       └── init.sql    # Database schema, constraints, indexes, seed reference data
└── package.json
```

## Development

```bash
npm run dev    # Start with auto-reload (Node 18+)
npm test       # Run unit tests
```

## Deployment

The included GitHub Actions workflow (`.github/workflows/azure-webapps-node.yml`) verifies and deploys to Azure App Service. Configure:

1. Set `AZURE_WEBAPP_NAME` in the workflow file
2. Add `AZURE_WEBAPP_PUBLISH_PROFILE` as a repository secret
3. Configure App Service application settings for the environment variables below
4. Enable HTTPS Only in the Azure App Service TLS/SSL settings

The server listens on `process.env.PORT` (default 3000) and serves both the API and static previews.

### Environment Variables

Set these in Azure App Service Configuration, not in source control:

| Name | Required | Description |
|------|----------|-------------|
| `NODE_ENV` | Yes | Use `production` in Azure. |
| `PORT` | No | Azure normally injects this. Defaults to `3000` locally. |
| `DB_HOST` | Yes | PostgreSQL host name. |
| `DB_PORT` | Yes | PostgreSQL port, usually `5432`. |
| `DB_NAME` | Yes | Database name. |
| `DB_USER` | Yes | Database user. |
| `DB_PASSWORD` | Yes | Database password. |
| `JWT_SECRET` | Yes | Long random signing secret. Required in production. |
| `JWT_TTL_SECONDS` | No | JWT/session lifetime in seconds. Defaults to 8 hours. |
| `ENFORCE_HTTPS` | No | Defaults to HTTPS redirects in production. Set `false` only for trusted private test slots. |

### Secrets Management

- Store `AZURE_WEBAPP_PUBLISH_PROFILE` as a GitHub Actions repository secret.
- Store database credentials and `JWT_SECRET` in Azure App Service app settings or Key Vault references.
- Do not commit real `.env` files. Use `.env.example` as the local template.
- Rotate `JWT_SECRET` and database passwords after accidental exposure.

### CI/CD Verification

The workflow uses `npm ci`, runs `npm run verify`, uploads a deployment artifact without test files or local report data, deploys to Azure, then calls `/api/health` on the deployed app.

### HTTPS, Monitoring, And Logging

- Enable Azure App Service "HTTPS Only".
- The app also redirects forwarded HTTP requests to HTTPS in production and emits HSTS.
- `/api/health` reports database connectivity for deployment smoke tests and monitoring probes.
- Requests are logged as structured JSON with `requestId`, method, path, status, duration, and authenticated user id when available.
- Forward App Service logs to Azure Monitor or Application Insights for retention, alerts, and dashboards.

## Contact

isaacmunyua01@gmail.com
