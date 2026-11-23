# SLO Report Template

> Do not invent measurements. Replace placeholders only with evidence from production monitoring or approved logs.

## Period
- Period: `<7-day or 30-day period>`
- Release/commit: `<exact value>`

| Indicator | Measured | Target | Status | Evidence |
|---|---:|---:|---|---|
| Availability | `<value>` | >= 99.5% | `<PASS/FAIL>` | `<link/reference>` |
| 5xx error rate | `<value>` | < 1.0% | `<PASS/FAIL>` | `<link/reference>` |
| Average latency | `<value>` | < 750 ms | `<PASS/FAIL>` | `<link/reference>` |
| Backup freshness | `<value>` | <= 24 h | `<PASS/FAIL>` | `<link/reference>` |

## Interpretation
- What improved: `<evidence>`
- What regressed: `<evidence>`
- Corrective action: `<action>`
