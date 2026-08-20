"use strict";

const startedAt = Date.now();
const state = {
  requests: 0,
  errors: 0,
  byStatus: Object.create(null),
  byRoute: Object.create(null),
  totalDurationMs: 0,
};

function metricsMiddleware(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const route = req.route?.path
      ? `${req.baseUrl || ""}${req.route.path}`
      : (req.path || req.url || "/").split("?")[0];
    const key = `${req.method} ${route}`;

    state.requests += 1;
    state.totalDurationMs += durationMs;
    state.byStatus[res.statusCode] = (state.byStatus[res.statusCode] || 0) + 1;
    state.byRoute[key] = (state.byRoute[key] || 0) + 1;
    if (res.statusCode >= 500) state.errors += 1;
  });
  next();
}

function snapshot() {
  const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);
  return {
    uptimeSeconds,
    requests: state.requests,
    errors: state.errors,
    errorRate: state.requests ? Number((state.errors / state.requests).toFixed(4)) : 0,
    averageDurationMs: state.requests
      ? Number((state.totalDurationMs / state.requests).toFixed(2))
      : 0,
    byStatus: { ...state.byStatus },
    byRoute: { ...state.byRoute },
  };
}

module.exports = { metricsMiddleware, snapshot };
