const { test } = require('node:test');
const assert = require('node:assert');

function loadStoreWithMockDb(seed = {}) {
  const dbPath = require.resolve('./db');
  const storePath = require.resolve('./store');

  delete require.cache[storePath];
  delete require.cache[dbPath];

  const state = {
    farms: seed.farms || [{ id: 'FARM-001', name: 'Green Valley Farm' }],
    cropTypes: seed.cropTypes || [{ id: 'CROP-001', name: 'Tomato' }],
    cropVarieties: seed.cropVarieties || [{ crop_type_id: 'CROP-001', name: 'Cherry Tomato' }],
    pests: seed.pests || [{ id: 'PEST-001', name: 'Whitefly' }, { id: 'PEST-002', name: 'Aphid' }],
    diseases: seed.diseases || [{ id: 'DISEASE-001', name: 'Early Blight' }],
    reports: seed.reports || [],
    pestObservations: seed.pestObservations || [],
    diseaseObservations: seed.diseaseObservations || [],
    calls: [],
  };

  async function runQuery(text, params = []) {
    const sql = text.replace(/\s+/g, ' ').trim();
    state.calls.push({ sql, params });

    if (sql.includes('FROM farms')) {
      const [farmId, farmName] = params;
      const farm = state.farms.find((item) => item.id === farmId || item.name === farmName);
      return rows(farm ? [farm] : []);
    }

    if (sql.includes('FROM crop_types')) {
      const cropType = state.cropTypes.find((item) => item.id === params[0] || item.name === params[0]);
      return rows(cropType ? [cropType] : []);
    }

    if (sql.includes('FROM crop_varieties')) {
      const [cropTypeId, variety] = params;
      const exists = state.cropVarieties.some((item) => item.crop_type_id === cropTypeId && item.name === variety);
      return result(exists ? 1 : 0, exists ? [{ '?column?': 1 }] : []);
    }

    if (sql.includes('FROM pests')) {
      const pest = state.pests.find((item) => item.id === params[0] || item.name === params[0]);
      return rows(pest ? [{ name: pest.name }] : []);
    }

    if (sql.includes('FROM diseases')) {
      const disease = state.diseases.find((item) => item.id === params[0] || item.name === params[0]);
      return rows(disease ? [{ name: disease.name }] : []);
    }

    if (sql.includes('MAX(CAST(SUBSTRING(id FROM 4) AS INTEGER))')) {
      const maxNum = state.reports.reduce((max, report) => {
        const match = /^SR-(\d+)$/.exec(report.id);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);
      return rows([{ max_num: maxNum }]);
    }

    if (sql.startsWith('INSERT INTO scout_reports')) {
      const [
        id,
        farmId,
        farmName,
        cropType,
        variety,
        isGreenhouse,
        reportDate,
        implementationWeek,
        implementationYear,
        weather,
        temperature,
        humidity,
        location,
        notes,
        status,
        createdAt,
        updatedAt,
      ] = params;

      if (state.reports.some((report) => report.id === id)) {
        const err = new Error('duplicate key');
        err.code = '23505';
        throw err;
      }

      state.reports.push({
        id,
        farm_id: farmId,
        farm_name: farmName,
        crop_type: cropType,
        variety,
        is_greenhouse: isGreenhouse,
        report_date: reportDate,
        implementation_week: implementationWeek,
        implementation_year: implementationYear,
        weather,
        temperature,
        humidity,
        location: location ? JSON.parse(location) : null,
        notes,
        status,
        created_at: createdAt,
        updated_at: updatedAt,
      });
      return result(1);
    }

    if (sql.startsWith('INSERT INTO pest_observations')) {
      const [id, reportId, pestType, count, severity, affectedPercent, locationOnPlant, notes] = params;
      state.pestObservations.push({
        id,
        report_id: reportId,
        pest_type: pestType,
        count,
        severity,
        affected_percent: affectedPercent,
        location_on_plant: locationOnPlant,
        notes,
        created_at: new Date('2026-06-29T08:00:00.000Z'),
      });
      return result(1);
    }

    if (sql.startsWith('INSERT INTO disease_observations')) {
      const [id, reportId, diseaseType, severity, affectedPercent, spotCount, spotColor, notes] = params;
      state.diseaseObservations.push({
        id,
        report_id: reportId,
        disease_type: diseaseType,
        severity,
        affected_percent: affectedPercent,
        spot_count: spotCount,
        spot_color: spotColor,
        notes,
        created_at: new Date('2026-06-29T08:00:00.000Z'),
      });
      return result(1);
    }

    if (sql.startsWith('SELECT id FROM scout_reports WHERE id = $1')) {
      const exists = state.reports.some((item) => item.id === params[0]);
      return result(exists ? 1 : 0, exists ? [{ id: params[0] }] : []);
    }

    if (sql.startsWith('UPDATE scout_reports SET status = $1')) {
      const [status, updatedAt, id] = params;
      const report = state.reports.find((item) => item.id === id);
      if (!report) return result(0);
      report.status = status;
      report.updated_at = updatedAt;
      return result(1, [{ id }]);
    }

    if (sql.startsWith('UPDATE scout_reports SET')) {
      const id = params.at(-1);
      const report = state.reports.find((item) => item.id === id);
      if (!report) return result(0);
      if (sql.includes('weather = $1')) report.weather = params[0];
      if (sql.includes('temperature = $1')) report.temperature = params[0];
      if (sql.includes('status = $1')) report.status = params[0];
      report.updated_at = params.at(-2);
      return result(1, [{ id }]);
    }

    if (sql.startsWith('DELETE FROM scout_reports WHERE id = $1')) {
      const index = state.reports.findIndex((item) => item.id === params[0]);
      if (index === -1) return result(0);
      state.reports.splice(index, 1);
      state.pestObservations = state.pestObservations.filter((item) => item.report_id !== params[0]);
      state.diseaseObservations = state.diseaseObservations.filter((item) => item.report_id !== params[0]);
      return result(1);
    }

    if (sql.includes('FROM scout_reports') && sql.includes('WHERE id = $1')) {
      const report = state.reports.find((item) => item.id === params[0]);
      return rows(report ? [report] : []);
    }

    if (sql.includes('FROM pest_observations') && sql.includes('WHERE report_id = $1')) {
      return rows(state.pestObservations.filter((item) => item.report_id === params[0]));
    }

    if (sql.includes('FROM disease_observations') && sql.includes('WHERE report_id = $1')) {
      return rows(state.diseaseObservations.filter((item) => item.report_id === params[0]));
    }

    if (sql.startsWith('SELECT pg_advisory_xact_lock')) return result(1);

    throw new Error(`Unhandled SQL in test mock: ${sql}`);
  }

  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      query: runQuery,
      transaction: async (callback) => callback({ query: runQuery }),
    },
  };

  return { store: require('./store'), state };
}

function result(rowCount, resultRows = []) {
  return { rowCount, rows: resultRows };
}

function rows(resultRows) {
  return result(resultRows.length, resultRows);
}

test('saveReport creates a report and observations transactionally', async () => {
  const { store, state } = loadStoreWithMockDb();

  const report = await store.saveReport({
    farmId: 'FARM-001',
    cropType: 'Tomato',
    variety: 'Cherry Tomato',
    reportDate: '2026-06-29',
    implementationWeek: 27,
    implementationYear: 2026,
    pestObservations: [
      {
        id: 'po-test',
        pestType: 'Whitefly',
        count: 4,
        severity: 'High',
        affectedPercent: 12,
      },
    ],
  });

  assert.equal(report.id, 'SR-000001');
  assert.equal(report.status, 'Pending');
  assert.equal(report.pestObservations.length, 1);
  assert.equal(state.reports.length, 1);
  assert.equal(state.pestObservations.length, 1);
  assert.ok(state.calls.some((call) => call.sql.includes('pg_advisory_xact_lock')));
});

test('saveReport validates crop variety and maps duplicate ids to conflict errors', async () => {
  const { store } = loadStoreWithMockDb({
    reports: [
      {
        id: 'SR-000001',
        farm_id: 'FARM-001',
        farm_name: 'Green Valley Farm',
        crop_type: 'Tomato',
        report_date: '2026-06-29',
        status: 'Completed',
        created_at: new Date('2026-06-29T08:00:00.000Z'),
        updated_at: new Date('2026-06-29T08:00:00.000Z'),
      },
    ],
  });

  await assert.rejects(
    () => store.saveReport({ farmId: 'FARM-001', cropType: 'Tomato', variety: 'Roma Tomato' }),
    /Valid variety is required/
  );

  await assert.rejects(
    () => store.saveReport({ id: 'SR-000001', farmId: 'FARM-001', cropType: 'Tomato' }),
    (err) => err.statusCode === 409 && /already exists/.test(err.message)
  );
});

test('findReport returns null for missing reports', async () => {
  const { store } = loadStoreWithMockDb();

  const report = await store.findReport('SR-404');

  assert.equal(report, null);
});

test('updateReport validates fields and returns the updated report', async () => {
  const { store } = loadStoreWithMockDb({
    reports: [
      {
        id: 'SR-000007',
        farm_id: 'FARM-001',
        farm_name: 'Green Valley Farm',
        crop_type: 'Tomato',
        report_date: '2026-06-29',
        status: 'Pending',
        created_at: new Date('2026-06-29T08:00:00.000Z'),
        updated_at: new Date('2026-06-29T08:00:00.000Z'),
      },
    ],
  });

  const report = await store.updateReport('SR-000007', { weather: 'Cloudy' });

  assert.equal(report.weather, 'Cloudy');
  await assert.rejects(
    () => store.updateReport('SR-000007', { status: 'Archived' }),
    /Invalid status/
  );
});

test('addPestObservation returns null for missing reports and refreshes status when found', async () => {
  const { store } = loadStoreWithMockDb({
    reports: [
      {
        id: 'SR-000008',
        farm_id: 'FARM-001',
        farm_name: 'Green Valley Farm',
        crop_type: 'Tomato',
        report_date: '2026-06-29',
        status: 'Completed',
        created_at: new Date('2026-06-29T08:00:00.000Z'),
        updated_at: new Date('2026-06-29T08:00:00.000Z'),
      },
    ],
  });

  assert.equal(await store.addPestObservation('SR-404', { pestType: 'Aphid' }), null);

  const report = await store.addPestObservation('SR-000008', {
    id: 'po-critical',
    pestType: 'Aphid',
    severity: 'Critical',
  });

  assert.equal(report.status, 'Critical');
  assert.equal(report.pestObservations.length, 1);
});

test('deleteReport removes existing reports and reports misses', async () => {
  const { store, state } = loadStoreWithMockDb({
    reports: [
      {
        id: 'SR-000009',
        farm_id: 'FARM-001',
        farm_name: 'Green Valley Farm',
        crop_type: 'Tomato',
        report_date: '2026-06-29',
        status: 'Completed',
        created_at: new Date('2026-06-29T08:00:00.000Z'),
        updated_at: new Date('2026-06-29T08:00:00.000Z'),
      },
    ],
    pestObservations: [{ id: 'po-delete', report_id: 'SR-000009' }],
  });

  assert.equal(await store.deleteReport('SR-000009'), true);
  assert.equal(state.reports.length, 0);
  assert.equal(state.pestObservations.length, 0);
  assert.equal(await store.deleteReport('SR-000009'), false);
});
