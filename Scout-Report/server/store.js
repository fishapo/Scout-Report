const crypto = require('crypto');
const { canonicalFromReport } = require('./canonical-report');
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


const FARM_ID_LOCK_KEY = 917248;


const CROP_TYPE_ID_LOCK_KEY = 917249;

const PEST_ID_LOCK_KEY = 917250;

const DISEASE_ID_LOCK_KEY = 917251;

async function getDiseasesAdmin() {
  const result = await query('SELECT id, name, description FROM diseases ORDER BY name, id');
  return result.rows;
}

async function findDisease(id) {
  assertNonEmptyString(id, 'Disease id is required');
  const result = await query(
    'SELECT id, name, description FROM diseases WHERE id = $1',
    [id.trim()]
  );
  return result.rows[0] || null;
}

async function createDisease(input = {}) {
  return withStoreErrors(async () => {
    const normalized = normalizeDiseaseInput(input, false);
    return transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock($1)', [DISEASE_ID_LOCK_KEY]);
      const idResult = await client.query(`
        SELECT COALESCE(MAX(
          CASE
            WHEN id ~ '^DISEASE-[0-9]+$' THEN CAST(SUBSTRING(id FROM 9) AS INTEGER)
            ELSE 0
          END
        ), 0)::int AS max_num
        FROM diseases
      `);
      const nextNumber = Number(idResult.rows[0]?.max_num || 0) + 1;
      const id = `DISEASE-${String(nextNumber).padStart(3, '0')}`;
      const result = await client.query(
        `INSERT INTO diseases (id, name, description) VALUES ($1, $2, $3)
         RETURNING id, name, description`,
        [id, normalized.name, normalized.description]
      );
      return result.rows[0];
    });
  });
}

async function updateDisease(id, updates = {}) {
  return withStoreErrors(async () => {
    assertNonEmptyString(id, 'Disease id is required');
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new StoreError('Updates must be an object');
    }
    const existing = await findDisease(id);
    if (!existing) return null;
    const normalized = normalizeDiseaseInput(updates, true);
    const fields = [];
    const params = [];
    if ('name' in normalized) { params.push(normalized.name); fields.push(`name = $${params.length}`); }
    if ('description' in normalized) { params.push(normalized.description); fields.push(`description = $${params.length}`); }
    if (!fields.length) throw new StoreError('At least one mutable disease field is required');
    params.push(id.trim());
    const result = await query(
      `UPDATE diseases SET ${fields.join(', ')} WHERE id = $${params.length}
       RETURNING id, name, description`,
      params
    );
    return result.rows[0] || null;
  });
}

async function deleteDisease(id) {
  return withStoreErrors(async () => {
    assertNonEmptyString(id, 'Disease id is required');
    return transaction(async (client) => {
      const existing = await client.query('SELECT id FROM diseases WHERE id = $1 FOR UPDATE', [id.trim()]);
      if (existing.rowCount === 0) return { deleted: false, reason: 'not_found' };

      // Historical observations store disease_type as text, not a foreign key.
      // Deleting a reference disease therefore does not cascade/delete observations.
      const deleted = await client.query('DELETE FROM diseases WHERE id = $1 RETURNING id', [id.trim()]);
      return { deleted: deleted.rowCount === 1, reason: 'deleted', id: deleted.rows[0]?.id };
    });
  });
}

function normalizeDiseaseInput(input, partial) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new StoreError('Disease data must be an object');
  }
  const output = {};
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'name')) {
    if (typeof input.name !== 'string' || input.name.trim() === '') throw new StoreError('Disease name is required');
    const name = input.name.trim();
    if (name.length > 255) throw new StoreError('Disease name must not exceed 255 characters');
    output.name = name;
  }
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'description')) {
    if (input.description == null || input.description === '') output.description = null;
    else if (typeof input.description !== 'string') throw new StoreError('Disease description must be a string');
    else {
      const description = input.description.trim();
      output.description = description || null;
    }
  }
  return output;
}

async function getPestsAdmin() {
  const result = await query('SELECT id, name, description FROM pests ORDER BY name, id');
  return result.rows;
}

async function findPest(id) {
  assertNonEmptyString(id, 'Pest id is required');
  const result = await query(
    'SELECT id, name, description FROM pests WHERE id = $1',
    [id.trim()]
  );
  return result.rows[0] || null;
}

async function createPest(input = {}) {
  return withStoreErrors(async () => {
    const normalized = normalizePestInput(input, false);
    return transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock($1)', [PEST_ID_LOCK_KEY]);
      const idResult = await client.query(`
        SELECT COALESCE(MAX(
          CASE
            WHEN id ~ '^PEST-[0-9]+$' THEN CAST(SUBSTRING(id FROM 6) AS INTEGER)
            ELSE 0
          END
        ), 0)::int AS max_num
        FROM pests
      `);
      const nextNumber = Number(idResult.rows[0]?.max_num || 0) + 1;
      const id = `PEST-${String(nextNumber).padStart(3, '0')}`;
      const result = await client.query(
        `INSERT INTO pests (id, name, description) VALUES ($1, $2, $3)
         RETURNING id, name, description`,
        [id, normalized.name, normalized.description]
      );
      return result.rows[0];
    });
  });
}

async function updatePest(id, updates = {}) {
  return withStoreErrors(async () => {
    assertNonEmptyString(id, 'Pest id is required');
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new StoreError('Updates must be an object');
    }
    const existing = await findPest(id);
    if (!existing) return null;
    const normalized = normalizePestInput(updates, true);
    const fields = [];
    const params = [];
    if ('name' in normalized) { params.push(normalized.name); fields.push(`name = $${params.length}`); }
    if ('description' in normalized) { params.push(normalized.description); fields.push(`description = $${params.length}`); }
    if (!fields.length) throw new StoreError('At least one mutable pest field is required');
    params.push(id.trim());
    const result = await query(
      `UPDATE pests SET ${fields.join(', ')} WHERE id = $${params.length}
       RETURNING id, name, description`,
      params
    );
    return result.rows[0] || null;
  });
}

async function deletePest(id) {
  return withStoreErrors(async () => {
    assertNonEmptyString(id, 'Pest id is required');
    return transaction(async (client) => {
      const existing = await client.query('SELECT id FROM pests WHERE id = $1 FOR UPDATE', [id.trim()]);
      if (existing.rowCount === 0) return { deleted: false, reason: 'not_found' };

      // Historical observations store pest_type as text, not a foreign key.
      // Deleting a reference pest therefore does not cascade/delete observations.
      const deleted = await client.query('DELETE FROM pests WHERE id = $1 RETURNING id', [id.trim()]);
      return { deleted: deleted.rowCount === 1, reason: 'deleted', id: deleted.rows[0]?.id };
    });
  });
}

function normalizePestInput(input, partial) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new StoreError('Pest data must be an object');
  }
  const output = {};
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'name')) {
    if (typeof input.name !== 'string' || input.name.trim() === '') throw new StoreError('Pest name is required');
    const name = input.name.trim();
    if (name.length > 255) throw new StoreError('Pest name must not exceed 255 characters');
    output.name = name;
  }
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'description')) {
    if (input.description == null || input.description === '') output.description = null;
    else if (typeof input.description !== 'string') throw new StoreError('Pest description must be a string');
    else {
      const description = input.description.trim();
      output.description = description || null;
    }
  }
  return output;
}

async function getCropTypesAdmin() {
  const result = await query('SELECT id, name FROM crop_types ORDER BY name');
  return result.rows;
}

async function findCropType(id) {
  assertNonEmptyString(id, 'Crop type id is required');
  const result = await query(
    'SELECT id, name FROM crop_types WHERE id = $1',
    [id.trim()]
  );
  return result.rows[0] || null;
}

async function createCropType(input = {}) {
  return withStoreErrors(async () => {
    const normalized = normalizeCropTypeInput(input, false);
    return transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock($1)', [CROP_TYPE_ID_LOCK_KEY]);
      const idResult = await client.query(`
        SELECT COALESCE(MAX(
          CASE
            WHEN id ~ '^CROP-[0-9]+$' THEN CAST(SUBSTRING(id FROM 6) AS INTEGER)
            ELSE 0
          END
        ), 0)::int AS max_num
        FROM crop_types
      `);
      const nextNumber = Number(idResult.rows[0]?.max_num || 0) + 1;
      const id = `CROP-${String(nextNumber).padStart(3, '0')}`;
      const result = await client.query(
        `INSERT INTO crop_types (id, name) VALUES ($1, $2)
         RETURNING id, name`,
        [id, normalized.name]
      );
      return result.rows[0];
    });
  });
}

async function updateCropType(id, updates = {}) {
  return withStoreErrors(async () => {
    assertNonEmptyString(id, 'Crop type id is required');
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new StoreError('Updates must be an object');
    }
    const existing = await findCropType(id);
    if (!existing) return null;
    const normalized = normalizeCropTypeInput(updates, true);
    if (!('name' in normalized)) throw new StoreError('At least one mutable crop type field is required');
    const result = await query(
      'UPDATE crop_types SET name = $1 WHERE id = $2 RETURNING id, name',
      [normalized.name, id.trim()]
    );
    return result.rows[0] || null;
  });
}

async function deleteCropType(id) {
  return withStoreErrors(async () => {
    assertNonEmptyString(id, 'Crop type id is required');
    return transaction(async (client) => {
      const cropResult = await client.query(
        'SELECT id FROM crop_types WHERE id = $1 FOR UPDATE',
        [id.trim()]
      );
      if (cropResult.rowCount === 0) return { deleted: false, reason: 'not_found' };

      const dependencyResult = await client.query(
        'SELECT COUNT(*)::int AS count FROM crop_varieties WHERE crop_type_id = $1',
        [id.trim()]
      );
      const dependencyCount = Number(dependencyResult.rows[0]?.count || 0);
      if (dependencyCount > 0) return { deleted: false, reason: 'in_use', dependencyCount };

      const deleted = await client.query(
        'DELETE FROM crop_types WHERE id = $1 RETURNING id',
        [id.trim()]
      );
      return { deleted: deleted.rowCount === 1, reason: 'deleted' };
    });
  });
}

function normalizeCropTypeInput(input, partial) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new StoreError('Crop type data must be an object');
  }
  const output = {};
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'name')) {
    if (typeof input.name !== 'string' || input.name.trim() === '') {
      throw new StoreError('Crop type name is required');
    }
    const name = input.name.trim();
    if (name.length > 255) throw new StoreError('Crop type name must not exceed 255 characters');
    output.name = name;
  }
  return output;
}

async function getFarms() {
  const result = await query('SELECT id, name, location FROM farms ORDER BY name');
  return result.rows;
}

async function findFarm(id) {
  assertNonEmptyString(id, 'Farm id is required');
  const result = await query(
    'SELECT id, name, location FROM farms WHERE id = $1',
    [id.trim()]
  );
  return result.rows[0] || null;
}

async function createFarm(input = {}) {
  return withStoreErrors(async () => {
    const normalized = normalizeFarmInput(input, false);

    return transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock($1)', [FARM_ID_LOCK_KEY]);
      const idResult = await client.query(`
        SELECT COALESCE(MAX(
          CASE
            WHEN id ~ '^FARM-[0-9]+$' THEN CAST(SUBSTRING(id FROM 6) AS INTEGER)
            ELSE 0
          END
        ), 0)::int AS max_num
        FROM farms
      `);
      const nextNumber = Number(idResult.rows[0]?.max_num || 0) + 1;
      const id = `FARM-${String(nextNumber).padStart(3, '0')}`;
      const result = await client.query(
        `INSERT INTO farms (id, name, location) VALUES ($1, $2, $3)
         RETURNING id, name, location`,
        [id, normalized.name, normalized.location]
      );
      return result.rows[0];
    });
  });
}

async function updateFarm(id, updates = {}) {
  return withStoreErrors(async () => {
    assertNonEmptyString(id, 'Farm id is required');
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new StoreError('Updates must be an object');
    }

    const existing = await findFarm(id);
    if (!existing) return null;

    const normalized = normalizeFarmInput(updates, true);
    const fields = [];
    const params = [];

    if ('name' in normalized) {
      params.push(normalized.name);
      fields.push(`name = $${params.length}`);
    }
    if ('location' in normalized) {
      params.push(normalized.location);
      fields.push(`location = $${params.length}`);
    }

    if (fields.length === 0) {
      throw new StoreError('At least one mutable farm field is required');
    }

    params.push(id.trim());
    const result = await query(
      `UPDATE farms SET ${fields.join(', ')} WHERE id = $${params.length}
       RETURNING id, name, location`,
      params
    );
    return result.rows[0] || null;
  });
}

async function deleteFarm(id) {
  return withStoreErrors(async () => {
    assertNonEmptyString(id, 'Farm id is required');

    return transaction(async (client) => {
      const farmResult = await client.query(
        'SELECT id FROM farms WHERE id = $1 FOR UPDATE',
        [id.trim()]
      );
      if (farmResult.rowCount === 0) return { deleted: false, reason: 'not_found' };

      const dependencyResult = await client.query(
        'SELECT COUNT(*)::int AS count FROM scout_reports sr WHERE farm_id = $1',
        [id.trim()]
      );
      const dependencyCount = Number(dependencyResult.rows[0]?.count || 0);

      if (dependencyCount > 0) {
        return { deleted: false, reason: 'in_use', dependencyCount };
      }

      const deleted = await client.query(
        'DELETE FROM farms WHERE id = $1 RETURNING id',
        [id.trim()]
      );
      return { deleted: deleted.rowCount === 1, reason: 'deleted' };
    });
  });
}

function normalizeFarmInput(input, partial) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new StoreError('Farm data must be an object');
  }

  const output = {};
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'name')) {
    if (typeof input.name !== 'string' || input.name.trim() === '') {
      throw new StoreError('Farm name is required');
    }
    const name = input.name.trim();
    if (name.length > 255) throw new StoreError('Farm name must not exceed 255 characters');
    output.name = name;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'location')) {
    if (input.location == null || input.location === '') {
      output.location = null;
    } else if (typeof input.location !== 'string') {
      throw new StoreError('Farm location must be a string');
    } else {
      const location = input.location.trim();
      if (location.length > 255) throw new StoreError('Farm location must not exceed 255 characters');
      output.location = location || null;
    }
  }

  return output;
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

async function getCropVarietiesAdmin(cropTypeId) {
  assertNonEmptyString(cropTypeId, 'Crop type id is required');
  const parent = await findCropType(cropTypeId);
  if (!parent) return null;
  const result = await query(
    'SELECT id, crop_type_id, name FROM crop_varieties WHERE crop_type_id = $1 ORDER BY name, id',
    [cropTypeId.trim()]
  );
  return result.rows;
}

async function findCropVariety(cropTypeId, id) {
  assertNonEmptyString(cropTypeId, 'Crop type id is required');
  const varietyId = normalizeVarietyId(id);
  const result = await query(
    'SELECT id, crop_type_id, name FROM crop_varieties WHERE crop_type_id = $1 AND id = $2',
    [cropTypeId.trim(), varietyId]
  );
  return result.rows[0] || null;
}

async function createCropVariety(cropTypeId, input = {}) {
  return withStoreErrors(async () => {
    const parentId = normalizeParentCropTypeId(cropTypeId);
    const parent = await findCropType(parentId);
    if (!parent) throw new StoreError('Crop type not found', 404);
    const normalized = normalizeCropVarietyInput(input, false);
    const result = await query(
      `INSERT INTO crop_varieties (crop_type_id, name) VALUES ($1, $2)
       RETURNING id, crop_type_id, name`,
      [parentId, normalized.name]
    );
    return result.rows[0];
  });
}

async function updateCropVariety(cropTypeId, id, updates = {}) {
  return withStoreErrors(async () => {
    const parentId = normalizeParentCropTypeId(cropTypeId);
    const varietyId = normalizeVarietyId(id);
    const parent = await findCropType(parentId);
    if (!parent) throw new StoreError('Crop type not found', 404);
    const existing = await findCropVariety(parentId, varietyId);
    if (!existing) return null;
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new StoreError('Updates must be an object');
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'crop_type_id')) {
      throw new StoreError('Changing a variety crop type is not supported; use the correct parent route');
    }
    const normalized = normalizeCropVarietyInput(updates, true);
    if (!('name' in normalized)) throw new StoreError('At least one mutable crop variety field is required');
    const result = await query(
      'UPDATE crop_varieties SET name = $1 WHERE crop_type_id = $2 AND id = $3 RETURNING id, crop_type_id, name',
      [normalized.name, parentId, varietyId]
    );
    return result.rows[0] || null;
  });
}

async function deleteCropVariety(cropTypeId, id) {
  return withStoreErrors(async () => {
    const parentId = normalizeParentCropTypeId(cropTypeId);
    const varietyId = normalizeVarietyId(id);
    const parent = await findCropType(parentId);
    if (!parent) return { deleted: false, reason: 'parent_not_found' };
    const result = await query(
      'DELETE FROM crop_varieties WHERE crop_type_id = $1 AND id = $2 RETURNING id',
      [parentId, varietyId]
    );
    if (result.rowCount === 0) return { deleted: false, reason: 'not_found' };
    return { deleted: true, reason: 'deleted', id: result.rows[0].id };
  });
}

function normalizeParentCropTypeId(id) {
  assertNonEmptyString(id, 'Crop type id is required');
  return id.trim();
}

function normalizeVarietyId(id) {
  const value = String(id ?? '').trim();
  if (!/^[1-9][0-9]*$/.test(value)) throw new StoreError('Crop variety id must be a positive integer');
  return Number(value);
}

function normalizeCropVarietyInput(input, partial) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new StoreError('Crop variety data must be an object');
  }
  const output = {};
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'name')) {
    if (typeof input.name !== 'string' || input.name.trim() === '') {
      throw new StoreError('Crop variety name is required');
    }
    const name = input.name.trim();
    if (name.length > 255) throw new StoreError('Crop variety name must not exceed 255 characters');
    output.name = name;
  }
  return output;
}

async function getReports(filters = {}, user = null) {
  const { where, params } = buildReportFilters(filters);
  const { limit, offset } = normalizePagination(filters);
  const accessClause = buildAccessClause(user, params);
  const whereClause = buildWhereClause(where, accessClause);
  const queryParams = accessClause.params;
  const limitParam = queryParams.length + 1;
  const offsetParam = queryParams.length + 2;

  const result = await query(
    `
      SELECT
        sr.id, sr.farm_id, sr.farm_name, sr.crop_type, sr.variety, sr.is_greenhouse,
        sr.report_date, sr.implementation_week, sr.implementation_year,
        sr.weather, sr.temperature, sr.humidity, sr.location, sr.notes,
        sr.status, sr.canonical_payload, sr.created_at, sr.updated_at,
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
      ${whereClause}
      ORDER BY sr.created_at DESC, sr.id DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `,
    [...queryParams, limit, offset]
  );

  return result.rows.map(enrichReportRow);
}

async function findReport(id, client = null, user = null) {
  assertNonEmptyString(id, 'Report id is required');
  const run = db(client);
  const accessClause = buildAccessClause(user, [id]);
  const result = await run(
    `
      SELECT
        id, farm_id, farm_name, crop_type, variety, is_greenhouse,
        report_date, implementation_week, implementation_year,
        weather, temperature, humidity, location, notes, status, canonical_payload, created_at, updated_at
      FROM scout_reports sr
      WHERE sr.id = $1${accessClause.where}
    `,
    accessClause.params
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

async function saveReport(reportData, user = null) {
  return withStoreErrors(async () => {
    const normalized = await normalizeReportInput(reportData);

    return transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock($1)', [REPORT_ID_LOCK_KEY]);

      const id = normalized.id || (await nextReportId(client));
      const now = new Date();
      normalized.canonicalPayload = normalized.canonicalPayload || canonicalFromReport({ ...normalized, id }, {
        pestObservations: normalized.pestObservations,
        diseaseObservations: normalized.diseaseObservations,
      });
      const status = deriveStatus(normalized);

      await client.query(
        `
          INSERT INTO scout_reports (
            id, farm_id, farm_name, crop_type, variety, is_greenhouse,
            report_date, implementation_week, implementation_year,
            weather, temperature, humidity, location,
            organisation_id, grower_name, scout_name, field_name, field_area, field_area_unit,
            growth_stage, planting_date, expected_harvest_date, visit_purpose, scouting_pattern,
            visit_started_at, visit_ended_at, master_observations, canonical_payload, notes, status, owner_id, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28::jsonb, $29::jsonb, $30, $31, $32, $33)
        `,
        [
          id, normalized.farmId, normalized.farmName, normalized.cropType, normalized.variety, normalized.isGreenhouse,
          normalized.reportDate, normalized.implementationWeek, normalized.implementationYear, normalized.weather,
          normalized.temperature, normalized.humidity, normalized.location ? JSON.stringify(normalized.location) : null,
          normalized.organisationId, normalized.growerName, normalized.scoutName, normalized.fieldName, normalized.fieldArea, normalized.fieldAreaUnit,
          normalized.growthStage, normalized.plantingDate, normalized.expectedHarvestDate, normalized.visitPurpose, normalized.scoutingPattern,
          normalized.visitStartedAt, normalized.visitEndedAt, JSON.stringify(normalized.masterObservations || {}), JSON.stringify(normalized.canonicalPayload), normalized.notes, status, user?.id || null, now, now,
        ]
      );

      for (const observation of normalized.pestObservations) {
        await insertPestObservation(client, id, observation);
      }

      for (const observation of normalized.diseaseObservations) {
        await insertDiseaseObservation(client, id, observation);
      }

      if (user?.id) {
        await client.query(
          `INSERT INTO report_workflows (report_id, stage, current_holder_user_id, updated_at)
           VALUES ($1, 'draft', $2, NOW())
           ON CONFLICT (report_id) DO NOTHING`,
          [id, user.id]
        );
        await client.query(
          `INSERT INTO report_workflow_events
             (id, report_id, actor_user_id, actor_role, action, to_stage, recipient_user_id, comment, created_at)
           VALUES ($1,$2,$3,$4,'created','draft',$3,'Report created by scout.',NOW())
           ON CONFLICT (id) DO NOTHING`,
          [`wf-${crypto.randomUUID()}`, id, user.id, user.role]
        );
      }

      return findReport(id, client, user);
    });
  });
}

async function updateReport(id, updates, user = null) {
  return withStoreErrors(async () => {
    assertNonEmptyString(id, 'Report id is required');
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new StoreError('Updates must be an object');
    }

    const existing = await findReport(id, null, user);
    if (!existing) return null;

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

    if (fields.length === 0) return existing;

    params.push(new Date());
    fields.push(`updated_at = $${params.length}`);
    params.push(id);

    const result = await query(
      `UPDATE scout_reports SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id`,
      params
    );

    if (result.rowCount === 0) return null;
    return findReport(id, null, user);
  });
}

async function deleteReport(id, user = null) {
  return withStoreErrors(async () => {
    assertNonEmptyString(id, 'Report id is required');
    const report = await findReport(id, null, user);
    if (!report) return false;
    const result = await query('DELETE FROM scout_reports WHERE id = $1', [id]);
    return result.rowCount > 0;
  });
}

async function nextReportId(client = null) {
  const run = db(client);
  const result = await run(
    `
      SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 4) AS INTEGER)), 0) AS max_num
      FROM scout_reports sr
      WHERE id ~ '^SR-[0-9]+$'
    `
  );
  const maxNum = Number(result.rows[0]?.max_num || 0);
  return `SR-${String(maxNum + 1).padStart(6, '0')}`;
}

async function addPestObservation(reportId, obsData, user = null) {
  return withStoreErrors(async () => {
    assertNonEmptyString(reportId, 'Report id is required');
    const observation = await normalizePestObservation(obsData);

    return transaction(async (client) => {
      const exists = await client.query('SELECT id FROM scout_reports WHERE id = $1', [reportId]);
      if (exists.rowCount === 0) return null;
      const accessOk = await canAccessReport(client, reportId, user);
      if (!accessOk) return null;

      await insertPestObservation(client, reportId, observation);
      await refreshReportStatus(client, reportId);
      return findReport(reportId, client, user);
    });
  });
}

async function addDiseaseObservation(reportId, obsData, user = null) {
  return withStoreErrors(async () => {
    assertNonEmptyString(reportId, 'Report id is required');
    const observation = await normalizeDiseaseObservation(obsData);

    return transaction(async (client) => {
      const exists = await client.query('SELECT id FROM scout_reports WHERE id = $1', [reportId]);
      if (exists.rowCount === 0) return null;
      const accessOk = await canAccessReport(client, reportId, user);
      if (!accessOk) return null;

      await insertDiseaseObservation(client, reportId, observation);
      await refreshReportStatus(client, reportId);
      return findReport(reportId, client, user);
    });
  });
}

async function getStats(filters = {}, user = null) {
  const { where, params } = buildReportFilters(filters);
  const accessClause = buildAccessClause(user, params);
  const whereClause = buildWhereClause(where, accessClause);
  const queryParams = accessClause.params;
  const result = await query(
    `
      SELECT
        COUNT(*)::int AS total_reports,
        COUNT(DISTINCT farm_id)::int AS active_farms,
        COUNT(*) FILTER (WHERE status = 'Critical')::int AS critical_issues,
        COUNT(*) FILTER (WHERE status != 'Pending')::int AS acted_upon
      FROM scout_reports sr
      ${whereClause}
    `,
    queryParams
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

function buildAccessClause(user, params = []) {
  if (!user || user.role === 'admin') return { where: '', params };
  return {
    where: ` AND sr.owner_id = $${params.length + 1}`,
    params: [...params, user.id],
  };
}

function buildWhereClause(where, accessClause) {
  if (!accessClause.where) return where || '';
  const ownerClause = accessClause.where.replace(/^ AND /, '');
  if (!where) return `WHERE ${ownerClause}`;
  return `${where} AND ${ownerClause}`;
}

async function canAccessReport(client, reportId, user) {
  if (!user || user.role === 'admin') return true;
  const run = db(client);
  const result = await run(
    `SELECT 1 FROM scout_reports WHERE id = $1 AND owner_id = $2 LIMIT 1`,
    [reportId, user.id]
  );
  return result.rowCount > 0;
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
  console.error('PostgreSQL 22P02:', {
    message: err.message,
    detail: err.detail,
    hint: err.hint,
    where: err.where,
    position: err.position,
    routine: err.routine
  });

  return new StoreError(
    `Invalid data format: ${err.message || 'PostgreSQL rejected the supplied value'}`
  );
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

  const masterObservations = input.masterObservations && typeof input.masterObservations === 'object'
    ? input.masterObservations
    : {};
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
    organisationId: optionalString(input.organisationId),
    growerName: optionalString(input.growerName),
    scoutName: optionalString(input.scoutName),
    fieldName: optionalString(input.fieldName),
    fieldArea: normalizeOptionalNumber(input.fieldArea, 'fieldArea', 0, 100000000),
    fieldAreaUnit: optionalString(input.fieldAreaUnit),
    growthStage: optionalString(input.growthStage),
    plantingDate: input.plantingDate ? normalizeDate(input.plantingDate, 'plantingDate') : null,
    expectedHarvestDate: input.expectedHarvestDate ? normalizeDate(input.expectedHarvestDate, 'expectedHarvestDate') : null,
    visitPurpose: optionalString(input.visitPurpose),
    scoutingPattern: optionalString(input.scoutingPattern),
    visitStartedAt: input.visitStartedAt || null,
    visitEndedAt: input.visitEndedAt || null,
    masterObservations,
    pestObservations: await normalizeObservationArray(input.pestObservations, normalizePestObservation),
    diseaseObservations: await normalizeObservationArray(input.diseaseObservations, normalizeDiseaseObservation),
    notes: optionalString(input.notes),
    canonicalPayload: input.canonicalPayload && typeof input.canonicalPayload === 'object'
      ? input.canonicalPayload
      : null,
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
    organisationId: row.organisation_id || '',
    growerName: row.grower_name || '',
    scoutName: row.scout_name || '',
    fieldName: row.field_name || '',
    fieldArea: toNullableNumber(row.field_area),
    fieldAreaUnit: row.field_area_unit || '',
    growthStage: row.growth_stage || '',
    plantingDate: formatDate(row.planting_date),
    expectedHarvestDate: formatDate(row.expected_harvest_date),
    visitPurpose: row.visit_purpose || '',
    scoutingPattern: row.scouting_pattern || '',
    visitStartedAt: formatTimestamp(row.visit_started_at),
    visitEndedAt: formatTimestamp(row.visit_ended_at),
    masterObservations: typeof row.master_observations === 'string' ? JSON.parse(row.master_observations) : (row.master_observations || {}),
    canonicalPayload: typeof row.canonical_payload === 'string' ? JSON.parse(row.canonical_payload) : (row.canonical_payload || null),
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
  getFarms,
  findFarm,
  createFarm,
  updateFarm,
  deleteFarm,
  getPestsAdmin,
  findPest,
  createPest,
  updatePest,
  deletePest,
  getDiseasesAdmin,
  findDisease,
  createDisease,
  updateDisease,
  deleteDisease,
  getCropTypesAdmin,
  findCropType,
  createCropType,
  updateCropType,
  deleteCropType,
  getCropVarieties,
  getCropVarietiesAdmin,
  findCropVariety,
  createCropVariety,
  updateCropVariety,
  deleteCropVariety,
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
