"use strict";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function sameOriginWrites(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (!req.cookies?.access_token) return next();
  if (/^Bearer\s+/i.test(req.get("authorization") || "")) return next();

  const origin = req.get("origin");
  try {
    if (origin && new URL(origin).host === req.get("host")) return next();
  } catch (_error) {
    // Malformed origins are rejected below.
  }
  return res.status(403).json({ success: false, error: "Cross-site write request rejected" });
}

module.exports = sameOriginWrites;
