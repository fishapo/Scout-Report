# Phase 14 — Initial SLO Baseline

These are the first operational targets for the Scout Report production service. They are starting objectives, not measured historical performance.

| Service indicator | Initial target | Measurement | Alert starting point |
|---|---:|---|---:|
| Availability | >= 99.5% monthly | `/api/health` successful checks | < 99.5% over rolling window |
| API 5xx error rate | < 1.0% | request metrics | >= 1.0% |
| API average latency | < 750 ms | `GET /api/admin/metrics` | sustained > 750 ms |
| Authentication throttles | Investigate spikes | HTTP 429 count | sudden sustained increase |
| Database health | 100% healthy during service window | `/api/health` DB status | any sustained unhealthy state |
| Backup freshness | <= 24 hours | backup metadata | > 24 hours |

## Baseline procedure

1. Capture `/api/health` at least every minute in staging and production.
2. Capture application request/error metrics at least every five minutes.
3. Record PostgreSQL health and backup age.
4. Review the first 7 and 30 days after production release.
5. Replace these starting targets with measured baselines only after sufficient evidence exists.

## Compatibility

SLO instrumentation must not alter the `/api/reference/*` response contract.
