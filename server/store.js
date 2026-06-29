const crypto = require('crypto');
const { query, transaction } = require('./db');

const REPORT_ID_LOCK_KEY = 917247;
const VALID_STATUSES = new Set(['Pending', 'Completed', 'Critical']);
const VALID_SEVERITIES = new Set(['Low', 'Medium', 'High', 'Critical']);
const DEFAULT_REPORT_LIMIT = 100;
const MAX_REPORT_LIMIT = 500;

class StoreError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'StoreError';
    this.statusCode = statusCode;
  }
}

function db(client) {
  return client ? client.query.bind(client) : query;
}

async function getReference() {
  const [farms, cropTypes, varieties, pests, diseases] = await Promise.all([
    query('SELECT id, name, location FROM farms ORDER BY name'),
    query('SELECT id, name FROM crop_types ORDER BY name'),
    query('SELECT crop_type_id, name FROM crop_varieties ORDER BY name'),
    query('SELECT id, name, description FROM pests ORDER BY name'),
    query('SELECT id, name, description FROM diseases ORDER BY name'),
  ]);

  const varietiesByCrop = varieties.rows.reduce((grouped, row) => {
    grouped[row.crop_type_id] ||= [];
    grouped[row.crop_type_id].push(row.name);
    return grouped;
  }, {});

  return {
    farms: farms.rows,
    cropTypes: cropTypes.rows.map((crop) => ({
      ...crop,
      varieties: varietiesByCrop[crop.id] || [],
    })),
    pests: pests.rows,
    diseases: diseases.rows,
  };
}

async function getCropVarieties(cropTypeId) {
  assertNonEmptyString(cropTypeId, 'Crop type id is required');
  const result = await query(
    'SELECT name FROM crop_varieties WHERE crop_type_id = $1 ORDER BY name',
    [cropTypeId]
  );
  return result.rows.map((row) => row.name);
}

async function getReports(filters = {}) {
  const { where, params } = buildReportFilters(filters);
  const { limit, offset } = normalizePagination(filters);
  const limitParam = params.length + 1;
  const offsetParam = params.length + 2;

  const result = await query(
    `
      SELECT
        sr.id, sr.farm_id, sr.farm_name, sr.crop_type, sr.variety, sr.is_greenhouse,
        sr.report_date, sr.implementation_week, sr.implementation_year,
        sr.weather, sr.temperature, sr.humidity, sr.location, sr.notes,
        sr.status, sr.created_at, sr.updated_at,
        COALESCE(pests.pest_count, 0)::int AS pest_count,
        COALESCE(diseases.disease_count, 0)::int AS disease_count,
        COALESCE(pests.observations, '[]'::jsonb) AS pest_observations,
        COALESCE(diseases.observations, '[]'::jsonb) AS disease_observations
      FROM scout_reports sr
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS pest_count,
          jsonb_agg(
            jsonb_build_object(
              'id', po.id,
              'pestType', po.pest_type,
              'count', po.count,
              'severity', po.severity,
              'affectedPercent', po.affected_percent,
              'locationOnPlant', po.location_on_plant,
              'notes', po.notes
            )
            ORDER BY po.created_at, po.id
          ) AS observations
        FROM pest_observations po
        WHERE po.report_id = sr.id
      ) pests ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS disease_count,
          jsonb_agg(
            jsonb_build_object(
              'id', dob.id,
              'diseaseType', dob.disease_type,
              'severity', dob.severity,
              'affectedPercent', dob.affected_percent,
              'spotCount', dob.spot_count,
              'spotColor', dob.spot_color,
              'notes', dob.notes
            )
            ORDER BY dob.created_at, dob.id
          ) AS observations
        FROM disease_observations dob
        WHERE dob.report_id = sr.id
      ) diseases ON TRUE
      ${where}
      ORDER BY sr.created_at DESC, sr.id DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `,
    [...params, limit, offset]
  );

  return result.rows.map(enrichReportRow);
}

async function findReport(id, client = null) {
  assertNonEmptyString(id, 'Report id is required');
  const run = db(client);
  const result = await run(
    `
      SELECT
        id, farm_id, farm_name, crop_type, variety, is_greenhouse,
        report_date, implementation_week, implementation_year,
        weather, temperature, humidity, location, notes, status, created_at, updated_at
      FROM scout_reports
      WHERE id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) return null;

  const pestObservations = await run(
    `
      SELECT id, pest_type, count, severity, affected_percent, location_on_plant, notes
      FROM pest_observations
      WHERE report_id = $1
      ORDER BY created_at, id
    `,
    [id]
  );
  const diseaseObservations = await run(
    `
      SELECT id, disease_type, severity, affected_percent, spot_count, spot_color, notes
      FROM disease_observations
      WHERE report_id = $1
      ORDER BY created_at, id
    `,
    [id]
  );

  return enrichReportRow({
    ...result.rows[0],
    pest_observations: pestObservations.rows.map(enrichPestObservation),
    disease_observations: diseaseObservations.rows.map(enrichDiseaseObservation),
  });
}

async function saveReport(reportData) {
  return withStoreErrors(async () => {
    const normalized = await normalizeReportInput(reportData);

    return transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock($1)', [REPORT_ID_LOCK_KEY]);

      const id = normalized.id || (await nextReportId(client));
      const now = new Date();
      const status = deriveStatus(normalized);

      await client.query(
        `
          INSERT INTO scout_reports (
            id, farm_id, farm_name, crop_type, variety, is_greenhouse,
            report_date, implementation_week, implementation_year,
            weather, temperature, humidity, location, notes, status, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17)
        `,
        [
          id,
          normalized.farmId,
          normalized.farmName,
          normalized.cropType,
          normalized.variety,
          normalized.isGreenhouse,
          normalized.reportDate,
          normalized.implementationWeek,
          normalized.implementationYear,
          normalized.weather,
          normalized.temperature,
          normalized.humidity,
          normalized.location ? JSON.stringify(normalized.location) : null,
          normalized.notes,
          status,
          now,
          now,
        ]
      );

      for (const observation of normalized.pestObservations) {
        await insertPestObservation(client, id, observation);
      }

      for (const observation of normalized.diseaseObservations) {
        await insertDiseaseObservation(client, id, observation);
      }

      return findReport(id, client);
    });
  });
}

async function updateReport(id, updates) {
  return withStoreErrors(async () => {
    assertNonEmptyString(id, 'Report id is required');
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new StoreError('Updates must be an object');
    }

    const allowedFields = new Map([
      ['weather', 'weather'],
      ['temperature', 'temperature'],
      ['humidity', 'humidity'],
      ['notes', 'notes'],
      ['status', 'status'],
    ]);
    const fields = [];
    const params = [];

    for (const [inputField, dbField] of allowedFields) {
      if (!(inputField in updates)) continue;
      const value = normalizeUpdateValue(inputField, updates[inputField]);
      params.push(value);
      fields.push(`${dbField} = $${params.length}`);
    }

    if (fields.length === 0) return findReport(id);

    params.push(new Date());
    fields.push(`updated_at = $${params.length}`);
    params.push(id);

    const result = await query(
      `UPDATE scout_reports SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id`,
      params
    );

    if (result.rowCount === 0) return null;
    return findReport(id);
  });
}

async function deleteReport(id) {
  return withStoreErrors(async () => {
    assertNonEmptyString(id, 'Report id is required');
    const result = await query('DELETE FROM scout_reports WHERE id = $1', [id]);
    return result.rowCount > 0;
  });
}

async function nextReportId(client = null) {
  const run = db(client);
  const result = await run(
    `
      SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 4) AS INTEGER)), 0) AS max_num
      FROM scout_reports
      WHERE id ~ '^SR-[0-9]+$'
    `
  );
  const maxNum = Number(result.rows[0]?.max_num || 0);
  return `SR-${String(maxNum + 1).padStart(6, '0')}`;
}

async function addPestObservation(reportId, obsData) {
  return withStoreErrors(async () => {
    assertNonEmptyString(reportId, 'Report id is required');
    const observation = await normalizePestObservation(obsData);

    return transaction(async (client) => {
      const exists = await client.query('SELECT id FROM scout_reports WHERE id = $1', [reportId]);
      if (exists.rowCount === 0) return null;

      await insertPestObservation(client, reportId, observation);
      await refreshReportStatus(client, reportId);
      return findReport(reportId, client);
    });
  });
}

async function addDiseaseObservation(reportId, obsData) {
  return withStoreErrors(async () => {
    assertNonEmptyString(reportId, 'Report id is required');
    const observation = await normalizeDiseaseObservation(obsData);

    return transaction(async (client) => {
      const exists = await client.query('SELECT id FROM scout_reports WHERE id = $1', [reportId]);
      if (exists.rowCount === 0) return null;

      await insertDiseaseObservation(client, reportId, observation);
      await refreshReportStatus(client, reportId);
      return findReport(reportId, client);
    });
  });
}

async function getStats(filters = {}) {
  const { where, params } = buildReportFilters(filters);
  const result = await query(
    `
      SELECT
        COUNT(*)::int AS total_reports,
        COUNT(DISTINCT farm_id)::int AS active_farms,
        COUNT(*) FILTER (WHERE status = 'Critical')::int AS critical_issues,
        COUNT(*) FILTER (WHERE status != 'Pending')::int AS acted_upon
      FROM scout_reports sr
      ${where}
    `,
    params
  );

  const row = result.rows[0];
  const totalReports = Number(row.total_reports || 0);
  const actedUpon = Number(row.acted_upon || 0);

  return {
    totalReports,
    criticalIssues: Number(row.critical_issues || 0),
    activeFarms: Number(row.active_farms || 0),
    responseRate: totalReports ? Math.round((actedUpon / totalReports) * 100) : 0,
  };
}

function buildReportFilters(filters) {
  const clauses = [];
  const params = [];

  if (filters.farm && filters.farm !== 'all') {
    params.push(filters.farm);
    clauses.push(`(sr.farm_id = $${params.length} OR sr.farm_name = $${params.length})`);
  }

  if (filters.status && filters.status !== 'all') {
    if (!VALID_STATUSES.has(filters.status)) throw new StoreError('Invalid status filter');
    params.push(filters.status);
    clauses.push(`sr.status = $${params.length}`);
  }

  if (filters.dateFrom) {
    params.push(normalizeDate(filters.dateFrom, 'dateFrom'));
    clauses.push(`sr.report_date >= $${params.length}`);
  }

  if (filters.dateTo) {
    params.push(normalizeDate(filters.dateTo, 'dateTo'));
    clauses.push(`sr.report_date <= $${params.length}`);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

function normalizePagination(filters) {
  const limit = normalizeOptionalInteger(filters.limit, 'limit', 1, MAX_REPORT_LIMIT) || DEFAULT_REPORT_LIMIT;
  const offset = normalizeOptionalInteger(filters.offset, 'offset', 0, 1000000) || 0;
  return { limit, offset };
}

async function withStoreErrors(operation) {
  try {
    return await operation();
  } catch (err) {
    if (err instanceof StoreError) throw err;
    throw normalizeDbError(err);
  }
}

function normalizeDbError(err) {
  if (err.code === '23505') {
    return new StoreError('A record with this identifier already exists', 409);
  }
  if (err.code === '23503') {
    return new StoreError('Referenced record does not exist');
  }
  if (err.code === '23514') {
    return new StoreError('Database constraint failed');
  }
  if (err.code === '22P02') {
    return new StoreError('Invalid data format');
  }
  return err;
}

async function normalizeReportInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new StoreError('Report payload must be an object');
  }

  const farm = await resolveFarm(input.farmId, input.farmName);
  const crop = await resolveCropType(input.cropType);
  const variety = optionalString(input.variety);
  if (variety) await assertCropVariety(crop.id, variety);

  return {
    id: input.id || null,
    farmId: farm.id,
    farmName: farm.name,
    cropType: crop.name,
    variety,
    isGreenhouse: Boolean(input.isGreenhouse),
    reportDate: normalizeDate(input.reportDate || new Date().toISOString().slice(0, 10), 'reportDate'),
    implementationWeek: normalizeInteger(input.implementationWeek ?? getIsoWeek(new Date()), 'implementationWeek', 1, 53),
    implementationYear: normalizeInteger(input.implementationYear ?? new Date().getFullYear(), 'implementationYear', 2000, 2100),
    weather: optionalString(input.weather) || 'Sunny',
    temperature: normalizeOptionalNumber(input.temperature, 'temperature', -50, 70),
    humidity: normalizeOptionalNumber(input.humidity, 'humidity', 0, 100),
    location: normalizeLocation(input.location),
    pestObservations: await normalizeObservationArray(input.pestObservations, normalizePestObservation),
    diseaseObservations: await normalizeObservationArray(input.diseaseObservations, normalizeDiseaseObservation),
    notes: optionalString(input.notes),
  };
}

async function resolveFarm(farmId, farmName) {
  if (!farmId && !farmName) throw new StoreError('Valid farm is required');

  const result = await query(
    `
      SELECT id, name
      FROM farms
      WHERE ($1::text IS NOT NULL AND id = $1)
         OR ($2::text IS NOT NULL AND name = $2)
      LIMIT 1
    `,
    [farmId || null, farmName || null]
  );

  if (result.rowCount === 0) throw new StoreError('Valid farm is required');
  return result.rows[0];
}

async function resolveCropType(cropType) {
  assertNonEmptyString(cropType, 'Crop type is required');

  const result = await query(
    `
      SELECT id, name
      FROM crop_types
      WHERE id = $1 OR name = $1
      LIMIT 1
    `,
    [cropType.trim()]
  );

  if (result.rowCount === 0) throw new StoreError('Valid crop type is required');
  return result.rows[0];
}

async function assertCropVariety(cropTypeId, variety) {
  const result = await query(
    `
      SELECT 1
      FROM crop_varieties
      WHERE crop_type_id = $1 AND name = $2
      LIMIT 1
    `,
    [cropTypeId, variety]
  );

  if (result.rowCount === 0) throw new StoreError('Valid variety is required for the selected crop type');
}

async function normalizeObservationArray(value, normalizer) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new StoreError('Observations must be an array');
  return Promise.all(value.map(normalizer));
}

async function normalizePestObservation(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new StoreError('Pest observation must be an object');
  }

  assertNonEmptyString(input.pestType, 'Pest type is required');
  const pest = await resolveReferenceName('pests', input.pestType, 'pest type');
  const severity = normalizeSeverity(input.severity);

  return {
    id: optionalString(input.id) || makeObservationId('po'),
    pestType: pest.name,
    count: normalizeInteger(input.count ?? 0, 'count', 0, 1000000),
    severity,
    affectedPercent: normalizeOptionalNumber(input.affectedPercent ?? 0, 'affectedPercent', 0, 100),
    locationOnPlant: optionalString(input.locationOnPlant),
    notes: optionalString(input.notes),
  };
}

async function normalizeDiseaseObservation(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new StoreError('Disease observation must be an object');
  }

  assertNonEmptyString(input.diseaseType, 'Disease type is required');
  const disease = await resolveReferenceName('diseases', input.diseaseType, 'disease type');
  const severity = normalizeSeverity(input.severity);

  return {
    id: optionalString(input.id) || makeObservationId('do'),
    diseaseType: disease.name,
    severity,
    affectedPercent: normalizeOptionalNumber(input.affectedPercent ?? 0, 'affectedPercent', 0, 100),
    spotCount: normalizeInteger(input.spotCount ?? 0, 'spotCount', 0, 1000000),
    spotColor: optionalString(input.spotColor),
    notes: optionalString(input.notes),
  };
}

async function resolveReferenceName(table, value, label) {
  const candidate = value.trim();
  const result = await query(
    `
      SELECT name
      FROM ${table}
      WHERE id = $1 OR name = $1
      LIMIT 1
    `,
    [candidate]
  );

  if (result.rowCount === 0) throw new StoreError(`Valid ${label} is required`);
  return result.rows[0];
}

async function insertPestObservation(client, reportId, observation) {
  await client.query(
    `
      INSERT INTO pest_observations (
        id, report_id, pest_type, count, severity, affected_percent, location_on_plant, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      observation.id,
      reportId,
      observation.pestType,
      observation.count,
      observation.severity,
      observation.affectedPercent,
      observation.locationOnPlant,
      observation.notes,
    ]
  );
}

async function insertDiseaseObservation(client, reportId, observation) {
  await client.query(
    `
      INSERT INTO disease_observations (
        id, report_id, disease_type, severity, affected_percent, spot_count, spot_color, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      observation.id,
      reportId,
      observation.diseaseType,
      observation.severity,
      observation.affectedPercent,
      observation.spotCount,
      observation.spotColor,
      observation.notes,
    ]
  );
}

async function refreshReportStatus(client, reportId) {
  const report = await findReport(reportId, client);
  const status = deriveStatus(report);
  await client.query(
    'UPDATE scout_reports SET status = $1, updated_at = $2 WHERE id = $3',
    [status, new Date(), reportId]
  );
}

function normalizeUpdateValue(field, value) {
  if (field === 'temperature') return normalizeOptionalNumber(value, field, -50, 70);
  if (field === 'humidity') return normalizeOptionalNumber(value, field, 0, 100);
  if (field === 'status') {
    if (!VALID_STATUSES.has(value)) throw new StoreError('Invalid status');
    return value;
  }
  return optionalString(value);
}

function deriveStatus(report) {
  const severities = [
    ...(report?.pestObservations || []).map((observation) => observation.severity),
    ...(report?.diseaseObservations || []).map((observation) => observation.severity),
  ];

  if (severities.includes('Critical')) return 'Critical';
  if (severities.includes('High')) return 'Pending';
  if (severities.length === 0) return 'Completed';
  return 'Pending';
}

function enrichReportRow(row) {
  const pestObservations = parseJsonbArray(row.pest_observations).map(enrichPestObservation);
  const diseaseObservations = parseJsonbArray(row.disease_observations).map(enrichDiseaseObservation);

  return {
    id: row.id,
    farmId: row.farm_id,
    farmName: row.farm_name,
    cropType: row.crop_type,
    variety: row.variety || '',
    isGreenhouse: Boolean(row.is_greenhouse),
    reportDate: formatDate(row.report_date),
    implementationWeek: row.implementation_week,
    implementationYear: row.implementation_year,
    weather: row.weather || '',
    temperature: toNullableNumber(row.temperature),
    humidity: toNullableNumber(row.humidity),
    location: typeof row.location === 'string' ? JSON.parse(row.location) : row.location,
    pestObservations,
    diseaseObservations,
    notes: row.notes || '',
    status: row.status,
    createdAt: formatTimestamp(row.created_at),
    updatedAt: formatTimestamp(row.updated_at),
    pestCount: Number(row.pest_count ?? pestObservations.length),
    diseaseCount: Number(row.disease_count ?? diseaseObservations.length),
  };
}

function enrichPestObservation(row) {
  return {
    id: row.id,
    pestType: row.pestType ?? row.pest_type,
    count: Number(row.count || 0),
    severity: row.severity,
    affectedPercent: toNullableNumber(row.affectedPercent ?? row.affected_percent) ?? 0,
    locationOnPlant: row.locationOnPlant ?? row.location_on_plant ?? '',
    notes: row.notes || '',
  };
}

function enrichDiseaseObservation(row) {
  return {
    id: row.id,
    diseaseType: row.diseaseType ?? row.disease_type,
    severity: row.severity,
    affectedPercent: toNullableNumber(row.affectedPercent ?? row.affected_percent) ?? 0,
    spotCount: Number(row.spotCount ?? row.spot_count ?? 0),
    spotColor: row.spotColor ?? row.spot_color ?? '',
    notes: row.notes || '',
  };
}

function parseJsonbArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return JSON.parse(value);
}

function assertNonEmptyString(value, message) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new StoreError(message);
  }
}

function optionalString(value) {
  if (value == null) return '';
  if (typeof value !== 'string') return String(value).trim();
  return value.trim();
}

function normalizeSeverity(value = 'Low') {
  if (!VALID_SEVERITIES.has(value)) throw new StoreError('Invalid severity');
  return value;
}

function normalizeDate(value, field) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new StoreError(`${field} must be a date in YYYY-MM-DD format`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new StoreError(`${field} must be a valid date`);
  }
  return value;
}

function normalizeInteger(value, field, min, max) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new StoreError(`${field} must be an integer between ${min} and ${max}`);
  }
  return number;
}

function normalizeOptionalInteger(value, field, min, max) {
  if (value == null || value === '') return null;
  return normalizeInteger(value, field, min, max);
}

function normalizeOptionalNumber(value, field, min, max) {
  if (value == null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new StoreError(`${field} must be a number between ${min} and ${max}`);
  }
  return number;
}

function normalizeLocation(value) {
  if (!value) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new StoreError('Location must be an object');
  }
  const latitude = normalizeOptionalNumber(value.latitude, 'latitude', -90, 90);
  const longitude = normalizeOptionalNumber(value.longitude, 'longitude', -180, 180);
  if (latitude == null || longitude == null) {
    throw new StoreError('Location requires latitude and longitude');
  }
  return { latitude, longitude };
}

function formatDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function formatTimestamp(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function toNullableNumber(value) {
  if (value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getIsoWeek(date) {
  const working = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = working.getUTCDay() || 7;
  working.setUTCDate(working.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(working.getUTCFullYear(), 0, 1));
  return Math.ceil(((working - yearStart) / 86400000 + 1) / 7);
}

function makeObservationId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

module.exports = {
  StoreError,
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
