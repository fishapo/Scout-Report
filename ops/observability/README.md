# Observability Configuration

The application emits structured request logs and now maintains lightweight in-process request metrics.

`GET /api/admin/metrics` is admin-only and reports request count, 5xx errors, status distribution, route counts,
uptime and average request duration for the current process.

The version-controlled `config.yml` defines baseline alert thresholds. Production monitoring systems may ingest
these values into Azure Monitor, Application Insights, Prometheus/Grafana, or an equivalent platform.

Metrics are process-local and are not a replacement for durable telemetry. Production deployments should export
or scrape them and reset them naturally on process restart.
