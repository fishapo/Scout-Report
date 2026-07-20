const express = require('express');
const cors = require('cors');
const path = require('path');
const store = require('./store');
const auth = require('./auth');
const { getHealth } = require('./db');
const { logError, requestLogger } = require('./logger');

function createApp() {
  const app = express();

  function readCookie(req, name) {
    const header = req.headers.cookie || "";
    for (const entry of header.split(";")) {
      const [key, ...values] = entry.trim().split("=");
      if (key === name) {
        return decodeURIComponent(values.join("="));
      }
    }
    return null;
  }

  function requireSiteAuth(req, res, next) {
    const publicPaths = ["/login", "/auth/login", "/auth/register", "/api/health", "/favicon.ico"];

    if (publicPaths.includes(req.path) || req.path.startsWith("/previews")) {
      return next();
    }

    if (readCookie(req, "scout_auth") === "1") {
      return next();
    }

    return res.redirect("/login");
  }

  app.set("trust proxy", 1);

  app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:8080"],
    credentials: true
  }));

  app.use(requestLogger);
  app.use(securityHeaders);
  app.use(enforceHttps);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, "..", "previews")));
  app.use(requireSiteAuth);

  app.get("/login", (_req, res) => {
    res.type("html").send(`
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Scout Report Login</title>
        <style>
          :root { color-scheme: light dark; font-family: Arial, sans-serif; }
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, #0f172a, #1d4ed8);
            color: #f8fafc;
          }
          .card {
            width: min(92vw, 420px);
            padding: 24px;
            border-radius: 16px;
            background: rgba(255,255,255,0.12);
            box-shadow: 0 20px 45px rgba(0,0,0,0.25);
            backdrop-filter: blur(10px);
          }
          h1 { margin-top: 0; font-size: 1.6rem; }
          form { display: flex; flex-direction: column; gap: 12px; }
          input, button {
            padding: 10px 12px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            font-size: 1rem;
          }
          button {
            cursor: pointer;
            background: #f59e0b;
            color: #111827;
            border: none;
            font-weight: 700;
          }
          .hint { margin-top: 10px; font-size: 0.9rem; color: #e2e8f0; }
        </style>
      </head>
      <body>
        <main class="card">
          <h1>Scout Report Portal</h1>
          <p>Authenticate to continue.</p>
          <form id="loginForm">
            <input name="email" id="email" type="email" placeholder="Email" required />
            <input name="password" id="password" type="password" placeholder="Password" required />
            <button type="submit">Login</button>
          </form>
          <p class="hint">Use the existing auth endpoint if you already have an account.</p>
        </main>
        <script>
          document.getElementById("loginForm").addEventListener("submit", async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const body = new URLSearchParams(new FormData(form)).toString();

            const response = await fetch("/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body
            });

            if (response.ok) {
              window.location.href = "/";
            } else {
              alert("Login failed.");
            }
          });
        </script>
      </body>
      </html>
    `);
  });

  app.post(
    "/auth/register",
    asyncHandler(async (req, res) => {
      const result = await auth.registerUser(req.body);
      res.status(201).json(result);
    })
  );

  app.post(
    "/auth/login",
    asyncHandler(async (req, res) => {
      const result = await auth.loginUser(req.body);
      res.cookie("scout_auth", "1", {
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000
      });
      res.status(200).json(result);
    })
  );

  app.post(
    "/auth/logout",
    auth.authenticate,
    asyncHandler(async (req, res) => {
      res.clearCookie("scout_auth");
      res.status(200).json({ ok: true });
    })
  );

  app.get(
    '/api/health',
    asyncHandler(async (_req, res) => {
      const database = await getHealth();
      res.status(database.status === 'healthy' ? 200 : 503).json({
        status: database.status === 'healthy' ? 'ok' : 'degraded',
        service: 'scout-report-api',
        database,
      });
    })
  );

  app.get(
    '/farms',
    asyncHandler(async (_req, res) => {
      const reference = await store.getReference();
      res.json(reference.farms);
    })
  );

  app.get(
    '/crop-types',
    asyncHandler(async (_req, res) => {
      const { cropTypes } = await store.getReference();
      res.json(cropTypes.map(({ id, name }) => ({ id, name })));
    })
  );

  app.get(
    '/crop-types/:id/varieties',
    asyncHandler(async (req, res) => {
      const { cropTypes } = await store.getReference();
      const crop = cropTypes.find((item) => item.id === req.params.id);
      if (!crop) {
        return res.status(404).json({ error: 'Crop type not found' });
      }
      res.json({ id: crop.id, name: crop.name, varieties: crop.varieties });
    })
  );

  app.get(
    '/pests',
    asyncHandler(async (_req, res) => {
      const reference = await store.getReference();
      res.json(reference.pests);
    })
  );

  app.get(
    '/diseases',
    asyncHandler(async (_req, res) => {
      const reference = await store.getReference();
      res.json(reference.diseases);
    })
  );

  app.get(
    '/scout-reports',
    auth.authenticate,
    asyncHandler(async (req, res) => {
      const reports = await store.getReports(req.query);
      res.json(reports);
    })
  );

  app.get(
    '/scout-reports/stats',
    auth.authenticate,
    auth.authorizeRoles('admin'),
    asyncHandler(async (req, res) => {
      const stats = await store.getStats(req.query);
      res.json(stats);
    })
  );

  app.get(
    '/scout-reports/:id',
    auth.authenticate,
    asyncHandler(async (req, res) => {
      const report = await store.findReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    })
  );

  app.post(
    '/scout-reports',
    auth.authenticate,
    auth.authorizeRoles('admin', 'scout'),
    asyncHandler(async (req, res) => {
      const report = await store.saveReport(req.body);
      res.status(201).json(report);
    })
  );

  app.patch(
    '/scout-reports/:id',
    auth.authenticate,
    auth.authorizeRoles('admin'),
    asyncHandler(async (req, res) => {
      const report = await store.updateReport(req.params.id, req.body);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    })
  );

  app.post(
    '/scout-reports/:id/pest-observations',
    auth.authenticate,
    auth.authorizeRoles('admin', 'scout'),
    asyncHandler(async (req, res) => {
      const report = await store.addPestObservation(req.params.id, req.body);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.status(201).json(report);
    })
  );

  app.post(
    '/scout-reports/:id/disease-observations',
    auth.authenticate,
    auth.authorizeRoles('admin', 'scout'),
    asyncHandler(async (req, res) => {
      const report = await store.addDiseaseObservation(req.params.id, req.body);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.status(201).json(report);
    })
  );

  app.delete(
    '/scout-reports/:id',
    auth.authenticate,
    auth.authorizeRoles('admin'),
    asyncHandler(async (req, res) => {
      const deleted = await store.deleteReport(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.status(204).send();
    })
  );

  app.get("/", (_req, res) => {
    res.type("html").send(`
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Scout Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 2rem; }
          .wrap { max-width: 720px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>Scout Report Dashboard</h1>
          <p>Welcome. Authentication is complete.</p>
          <form action="/auth/logout" method="post">
            <button type="submit">Logout</button>
          </form>
        </div>
      </body>
      </html>
    `);
  });

  app.use((err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    if (statusCode >= 500) {
      logError('request_failed', err, {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl || req.url,
      });
    }
    res.status(statusCode).json({
      error: statusCode >= 500 ? 'Internal server error' : err.message,
    });
  });
  return app;
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function securityHeaders(_req, res, next) {
  res.setHeader('x-content-type-options', 'nosniff');
  // Allow iframes from same origin for preview functionality
  res.setHeader('x-frame-options', 'SAMEORIGIN');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('permissions-policy', 'geolocation=(), microphone=(), camera=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

function enforceHttps(req, res, next) {
  const shouldRedirect =
    process.env.NODE_ENV === 'production' &&
    process.env.ENFORCE_HTTPS !== 'false' &&
    req.get('x-forwarded-proto') === 'http';

  if (!shouldRedirect) return next();

  const host = req.get('host');
  return res.redirect(308, `https://${host}${req.originalUrl || req.url}`);
}

module.exports = { createApp };
