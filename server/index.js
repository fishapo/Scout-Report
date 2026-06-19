const express = require('express');
const path = require('path');
const store = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'previews')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'scout-report-api' });
});

app.get('/farms', (_req, res) => {
  res.json(store.getReference().farms);
});

app.get('/crop-types', (_req, res) => {
  const { cropTypes } = store.getReference();
  res.json(cropTypes.map(({ id, name }) => ({ id, name })));
});

app.get('/crop-types/:id/varieties', (req, res) => {
  const crop = store.getReference().cropTypes.find((c) => c.id === req.params.id);
  if (!crop) {
    return res.status(404).json({ error: 'Crop type not found' });
  }
  res.json({ id: crop.id, name: crop.name, varieties: crop.varieties });
});

app.get('/pests', (_req, res) => {
  res.json(store.getReference().pests);
});

app.get('/diseases', (_req, res) => {
  res.json(store.getReference().diseases);
});

app.get('/scout-reports', (req, res) => {
  let reports = store.getReports();
  const { farm, status, dateFrom, dateTo } = req.query;

  if (farm && farm !== 'all') {
    reports = reports.filter((r) => r.farmId === farm || r.farmName === farm);
  }
  if (status && status !== 'all') {
    reports = reports.filter((r) => r.status === status);
  }
  if (dateFrom) {
    reports = reports.filter((r) => r.reportDate >= dateFrom);
  }
  if (dateTo) {
    reports = reports.filter((r) => r.reportDate <= dateTo);
  }

  res.json(reports);
});

app.get('/scout-reports/stats', (_req, res) => {
  const reports = store.getReports();
  const farms = new Set(reports.map((r) => r.farmId));
  const critical = reports.filter((r) => r.status === 'Critical').length;
  const actedUpon = reports.filter((r) => r.status !== 'Pending').length;

  res.json({
    totalReports: reports.length,
    criticalIssues: critical,
    activeFarms: farms.size,
    responseRate: reports.length ? Math.round((actedUpon / reports.length) * 100) : 0,
  });
});

app.get('/scout-reports/:id', (req, res) => {
  const report = store.findReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

app.post('/scout-reports', (req, res) => {
  const body = req.body;
  const reference = store.getReference();
  const farm = reference.farms.find((f) => f.id === body.farmId || f.name === body.farmName);

  if (!farm) {
    return res.status(400).json({ error: 'Valid farm is required' });
  }
  if (!body.cropType) {
    return res.status(400).json({ error: 'Crop type is required' });
  }

  const report = {
    id: store.nextReportId(),
    farmId: farm.id,
    farmName: farm.name,
    cropType: body.cropType,
    variety: body.variety || '',
    isGreenhouse: Boolean(body.isGreenhouse),
    reportDate: body.reportDate || new Date().toISOString().slice(0, 10),
    implementationWeek: body.implementationWeek ?? 1,
    implementationYear: body.implementationYear ?? new Date().getFullYear(),
    weather: body.weather || 'Sunny',
    temperature: body.temperature ?? null,
    humidity: body.humidity ?? null,
    location: body.location || null,
    pestObservations: body.pestObservations || [],
    diseaseObservations: body.diseaseObservations || [],
    notes: body.notes || '',
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };

  report.status = store.deriveStatus(report);
  store.saveReport(report);
  res.status(201).json(report);
});

app.post('/scout-reports/:id/pest-observations', (req, res) => {
  const report = store.findReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const observation = {
    id: `po-${Date.now()}`,
    pestType: req.body.pestType,
    count: req.body.count ?? 0,
    severity: req.body.severity || 'Low',
    affectedPercent: req.body.affectedPercent ?? 0,
    locationOnPlant: req.body.locationOnPlant || '',
    notes: req.body.notes || '',
  };

  const updated = store.updateReport(req.params.id, (current) => {
    current.pestObservations.push(observation);
    current.status = store.deriveStatus(current);
    return current;
  });

  res.status(201).json(updated);
});

app.post('/scout-reports/:id/disease-observations', (req, res) => {
  const report = store.findReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const observation = {
    id: `do-${Date.now()}`,
    diseaseType: req.body.diseaseType,
    severity: req.body.severity || 'Low',
    affectedPercent: req.body.affectedPercent ?? 0,
    spotCount: req.body.spotCount ?? 0,
    spotColor: req.body.spotColor || '',
    notes: req.body.notes || '',
  };

  const updated = store.updateReport(req.params.id, (current) => {
    current.diseaseObservations.push(observation);
    current.status = store.deriveStatus(current);
    return current;
  });

  res.status(201).json(updated);
});

app.delete('/scout-reports/:id', (req, res) => {
  const deleted = store.deleteReport(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.status(204).send();
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'previews', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Scout Report server running at http://localhost:${PORT}`);
});
