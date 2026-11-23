# Scout Report — Monitoring & Alerting Standard

## Health endpoints
- `GET /api/health` is the canonical dependency-aware health check.
- `GET /health` is the lightweight process/HTTP liveness endpoint.
- A 503 from `/api/health` means PostgreSQL is unavailable and should page the database/service owner.

## Request correlation
Every request receives an `x-request-id` header. Preserve this ID when correlating application logs, reverse-proxy logs and support tickets.

## Minimum production alerts
| Alert | Trigger | Severity | Action |
|---|---|---|---|
| API unhealthy | `/api/health` != 200 | Critical | Check application + PostgreSQL |
| Process unavailable | `/health` fails | Critical | Restart/rollback |
| Auth throttling | sustained 429s on login | High | Investigate abuse or credential attack |
| 5xx spike | sustained server errors | High | Inspect request IDs/logs |
| DB saturation | pool exhaustion/timeouts | High | Inspect PostgreSQL and connection usage |
| Disk growth | backup/log volume threshold | Medium | Rotate/archive and investigate |

## Dashboard minimums
Track uptime, health status, HTTP 4xx/5xx rate, latency, authentication failures/429s, database connectivity and backup age.
