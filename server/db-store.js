const { query, transaction } = require('./db');

// Reference data getters (read from DB)
async function getReference() {
  const [farms, cropTypes, pests, diseases] = await Promise.all([
    query('SELECT id, name, location FROM farms ORDER BY name'),
    query('SELECT id, name FROM crop_types ORDER BY name'),
    query('SELECT id, name, description FROM pests ORDER BY name'),
    query('SELECT id, name, description FROM diseases ORDER BY name'),
  ]);

  return {
    farms: farms.rows,
    cropTypes: cropTypes.rows,
    pests: pests.rows,
    diseases: diseases.rows,
  };
}

async function getCropVarieties(cropTypeId) {
  const result = await query(
    'SELECT name FROM crop_varieties WHERE crop_type_id = $1 ORDER BY name',
    [cropTypeId]
  );
  return result.rows.map((r) => r.name);
}

// Scout reports
async function getReports(filters = {}) {
  let sql = `
    SELECT 
      sr.id, sr.farm_id, sr.farm_name, sr.crop_type, sr.variety, sr.is_greenhouse,
      sr.report_date, sr.implementation_week, sr.implementation_year,
      sr.weather, sr.temperature, sr.humidity, sr.location, sr.notes,
      sr.status, sr.created_at, sr.updated_at,
      COUNT(DISTINCT po.id) as pest_count,
      COUNT(DISTINCT do_.id) as disease_count
    FROM scout_reports sr
    LEFT JOIN pest_observations po ON sr.id = po.report_id
    LEFT JOIN disease_observations do_ ON sr.id = do_.report_id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.farm && filters.farm !== 'all') {
    sql += ` AND sr.farm_id = $${paramIndex}`;
    params.push(filters.farm);
    paramIndex++;
  }

  if (filters.status && filters.status !== 'all') {
    sql += ` AND sr.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.dateFrom) {
    sql += ` AND sr.report_date >= $${paramIndex}`;
    params.push(filters.dateFrom);
    paramIndex++;
  }

  if (filters.dateTo) {
    sql += ` AND sr.report_date <= $${paramIndex}`;
    params.push(filters.dateTo);
    paramIndex++;
  }

  sql += ' GROUP BY sr.id ORDER BY sr.created_at DESC';

  const result = await query(sql, params);
  return result.rows.map(enrichReportRow);
}

async function findReport(id) {
  const result = await query(
    `SELECT 
      id, farm_id, farm_name, crop_type, variety, is_greenhouse,
      report_date, implementation_week, implementation_year,
      weather, temperature, humidity, location, notes, status, created_at, updated_at
    FROM scout_reports WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;

  const report = enrichReportRow(result.rows[0]);

  // Fetch observations
  const [pestObs, diseaseObs] = await Promise.all([
    query(
      `SELECT id, pest_type, count, severity, affected_percent, location_on_plant, notes
      FROM pest_observations WHERE report_id = $1 ORDER BY created_at`,
      [id]
    ),
    query(
      `SELECT id, disease_type, severity, affected_percent, spot_count, spot_color, notes
      FROM disease_observations WHERE report_id = $1 ORDER BY created_at`,
      [id]
    ),
  ]);

  report.pestObservations = pestObs.rows;
  report.diseaseObservations = diseaseObs.rows;

  return report;
}

async function saveReport(reportData) {
  const id = reportData.id || (await nextReportId());
  const now = new Date().toISOString();
  const status = deriveStatus(reportData);

  const result = await query(
    `INSERT INTO scout_reports (
      id, farm_id, farm_name, crop_type, variety, is_greenhouse,
      report_date, implementation_week, implementation_year,
      weather, temperature, humidity, location, notes, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *`,
    [
      id,
      reportData.farmId,
      reportData.farmName,
      reportData.cropType,
      reportData.variety || null,
      reportData.isGreenhouse || false,
      reportData.reportDate || new Date().toISOString().slice(0, 10),
      reportData.implementationWeek || null,
      reportData.implementationYear || null,
      reportData.weather || 'Sunny',
      reportData.temperature || null,
      reportData.humidity || null,
      reportData.location ? JSON.stringify(reportData.location) : null,
      reportData.notes || null,
      status,
      now,
      now,
    ]
  );

  const saved = result.rows[0];

  // Save observations if provided
  if (reportData.pestObservations && reportData.pestObservations.length > 0) {
    for (const obs of reportData.pestObservations) {
      await addPestObservation(id, obs);
    }
  }

  if (reportData.diseaseObservations && reportData.diseaseObservations.length > 0) {
    for (const obs of reportData.diseaseObservations) {
      await addDiseaseObservation(id, obs);
    }
  }

  return findReport(id);
}

async function updateReport(id, updates) {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = [
    'weather',
    'temperature',
    'humidity',
    'notes',
    'status',
  ];

  for (const field of allowedFields) {
    if (field in updates) {
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${dbField} = $${paramIndex}`);
      params.push(updates[field]);
      paramIndex++;
    }
  }

  if (fields.length === 0) return findReport(id);

  fields.push(`updated_at = $${paramIndex}`);
  params.push(new Date().toISOString());
  paramIndex++;

  params.push(id);

  const sql = `UPDATE scout_reports SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  await query(sql, params);

  return findReport(id);
}

async function deleteReport(id) {
  const result = await query('DELETE FROM scout_reports WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function nextReportId() {
  const result = await query(
    `SELECT MAX(CAST(SUBSTRING(id, 4) AS INTEGER)) as max_num FROM scout_reports WHERE id LIKE 'SR-%'`
  );
  const maxNum = result.rows[0]?.max_num || 0;
  return `SR-${String(maxNum + 1).padStart(6, '0')}`;
}

// Observations
async function addPestObservation(reportId, obsData) {
  const id = obsData.id || `po-${Date.now()}`;
  const result = await query(
    `INSERT INTO pest_observations (
      id, report_id, pest_type, count, severity, affected_percent, location_on_plant, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      id,
      reportId,
      obsData.pestType,
      obsData.count || 0,
      obsData.severity || 'Low',
      obsData.affectedPercent || 0,
      obsData.locationOnPlant || null,
      obsData.notes || null,
    ]
  );

  // Update report status
  const report = await findReport(reportId);
  const status = deriveStatus(report);
  if (status !== report.status) {
    await query('UPDATE scout_reports SET status = $1 WHERE id = $2', [status, reportId]);
  }

  return result.rows[0];
}

async function addDiseaseObservation(reportId, obsData) {
  const id = obsData.id || `do-${Date.now()}`;
  const result = await query(
    `INSERT INTO disease_observations (
      id, report_id, disease_type, severity, affected_percent, spot_count, spot_color, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      id,
      reportId,
      obsData.diseaseType,
      obsData.severity || 'Low',
      obsData.affectedPercent || 0,
      obsData.spotCount || 0,
      obsData.spotColor || null,
      obsData.notes || null,
    ]
  );

  // Update report status
  const report = await findReport(reportId);
  const status = deriveStatus(report);
  if (status !== report.status) {
    await query('UPDATE scout_reports SET status = $1 WHERE id = $2', [status, reportId]);
  }

  return result.rows[0];
}

// Stats
async function getStats() {
  const result = await query(`
    SELECT 
      COUNT(*) as total_reports,
      COUNT(DISTINCT farm_id) as active_farms,
      SUM(CASE WHEN status = 'Critical' THEN 1 ELSE 0 END) as critical_issues,
      SUM(CASE WHEN status != 'Pending' THEN 1 ELSE 0 END) as acted_upon
    FROM scout_reports
  `);

  const row = result.rows[0];
  const totalReports = parseInt(row.total_reports, 10);
  const responseRate =
    totalReports > 0 ? Math.round((parseInt(row.acted_upon, 10) / totalReports) * 100) : 0;

  return {
    totalReports,
    criticalIssues: parseInt(row.critical_issues, 10) || 0,
    activeFarms: parseInt(row.active_farms, 10) || 0,
    responseRate,
  };
}

// Helpers
function enrichReportRow(row) {
  return {
    id: row.id,
    farmId: row.farm_id,
    farmName: row.farm_name,
    cropType: row.crop_type,
    variety: row.variety,
    isGreenhouse: row.is_greenhouse,
    reportDate: row.report_date,
    implementationWeek: row.implementation_week,
    implementationYear: row.implementation_year,
    weather: row.weather,
    temperature: row.temperature,
    humidity: row.humidity,
    location: row.location ? JSON.parse(row.location) : null,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pestCount: row.pest_count || 0,
    diseaseCount: row.disease_count || 0,
  };
}

function deriveStatus(report) {
  const severities = [
    ...(report.pestObservations || []).map((o) => o.severity),
    ...(report.diseaseObservations || []).map((o) => o.severity),
  ];

  if (severities.includes('Critical')) return 'Critical';
  if (severities.includes('High')) return 'Pending';
  if (severities.length === 0) return 'Completed';
  return 'Pending';
}

module.exports = {
  getReference,
  getCropVarieties,
  getReports,
  findReport,
  saveReport,
  updateReport,
  deleteReport,
  nextReportId,
  addPestObservation,
  addDiseaseObservation,
  getStats,
  deriveStatus,
};
