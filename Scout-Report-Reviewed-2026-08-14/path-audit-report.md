# Path and URL Audit Report

## Summary

The repository’s preview assets now use relative paths so the HTML previews can be served from any static HTTP server without changing the code for a different host or port. Backend API routes were left unchanged.

## Modified files

| File | Original path | Replacement path |
| --- | --- | --- |
| [previews/index.html](previews/index.html) | `http://localhost:3000/user-form.html` | `./user-form.html` |
| [previews/index.html](previews/index.html) | `http://localhost:3000/admin-dashboard.html` | `./admin-dashboard.html` |
| [README.md](README.md) | `http://localhost:3000` | `./previews/` |
| [README.md](README.md) | `http://localhost:3000/user-form.html` | `./previews/user-form.html` |
| [README.md](README.md) | `http://localhost:3000/admin-dashboard.html` | `./previews/admin-dashboard.html` |
| [previews/README.md](previews/README.md) | `http://localhost:8000/previews/` | `/previews/` (served from the site root) |

## Remaining environment-specific configuration

These items remain environment-specific, but they are not preview asset paths and do not block serving the project from a generic HTTP server:

- [server/app.js](server/app.js): CORS origin list still contains localhost development origins.
- [server/index.js](server/index.js): the server host defaults to `127.0.0.1` when `HOST` is not supplied.
- [.vscode/launch.json](.vscode/launch.json): local debugging URL still points at `http://localhost:3030`.

## Notes

- No absolute filesystem paths were found in the repository content that required replacement.
- API endpoints such as `/auth/login`, `/auth/register`, and `/scout-reports` were not modified.
