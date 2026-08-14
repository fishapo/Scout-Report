function createRateLimiter({ windowMs, max, keyGenerator = (req) => req.ip }) {
  const requests = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = keyGenerator(req);
    const entry = requests.get(key);
    const active = entry && now - entry.startedAt < windowMs
      ? entry
      : { startedAt: now, count: 0 };

    active.count += 1;
    requests.set(key, active);

    if (active.count <= max) return next();

    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - active.startedAt)) / 1000));
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({ error: "Too many requests. Try again later." });
  };
}

module.exports = { createRateLimiter };
