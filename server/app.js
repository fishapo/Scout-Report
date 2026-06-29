const express = require('express');
const path = require('path');
const store = require('./store');
const auth = require('./auth');
const { getHealth } = require('./db');
const { logError, requestLogger } = require('./logger');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(requestLogger);
  app.use(securityHeaders);
  app.use(enforceHttps);
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'previews')));

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

  app.post(
    '/auth/register',
    asyncHandler(async (req, res) => {
      const result = await auth.registerUser(req.body);
      res.status(201).json(result);
    })
  );

  app.post(
    '/auth/login',
    asyncHandler(async (req, res) => {
      const result = await auth.loginUser(req.body);
      res.json(result);
    })
  );

  app.post(
    '/auth/logout',
    auth.authenticate,
    asyncHandler(async (req, res) => {
      await auth.logoutSession(req.session.id);
      res.status(204).send();
    })
  );

  app.get(
    '/auth/me',
    auth.authenticate,
    asyncHandler(async (req, res) => {
      res.json({ user: req.user, session: req.session });
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

  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'previews', 'index.html'));
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
