const { test } = require('node:test');
const assert = require('node:assert');

function loadStoreWithMockDb({ farms = [], reports = [] } = {}) {
  const dbPath = require.resolve('./db');
  const storePath = require.resolve('./store');
  delete require.cache[storePath];

  const state = { farms: farms.map((f) => ({ ...f })), reports: reports.map((r) => ({ ...r })), calls: [] };

  function result(rows = []) {
    return { rowCount: rows.length, rows };
  }

  async function runQuery(text, params = []) {
    const sql = text.replace(/\s+/g, ' ').trim();
    state.calls.push({ sql, params });

    if (sql.includes('SELECT id, name, location FROM farms WHERE id = $1')) {
      return result(state.farms.filter((f) => f.id === params[0]));
    }
    if (sql === 'SELECT id, name, location FROM farms ORDER BY name') {
      return result([...state.farms].sort((a, b) => a.name.localeCompare(b.name)));
    }
    if (sql.includes('MAX(') && sql.includes("id ~ '^FARM-[0-9]+$'")) {
      const max = state.farms.reduce((m, f) => {
        const match = /^FARM-(\d+)$/.exec(f.id);
        return match ? Math.max(m, Number(match[1])) : m;
      }, 0);
      return result([{ max_num: max }]);
    }
    if (sql.startsWith('INSERT INTO farms')) {
      const [id, name, location] = params;
      if (state.farms.some((f) => f.name === name || f.id === id)) {
        const err = new Error('duplicate'); err.code = '23505'; throw err;
      }
      const farm = { id, name, location };
      state.farms.push(farm);
      return result([farm]);
    }
    if (sql.startsWith('UPDATE farms SET')) {
      const id = params.at(-1);
      const farm = state.farms.find((f) => f.id === id);
      if (!farm) return result([]);
      if (sql.includes('name = $1')) farm.name = params[0];
      if (sql.includes('location = $2')) farm.location = params[1];
      else if (sql.includes('location = $1')) farm.location = params[0];
      if (state.farms.some((f) => f !== farm && f.name === farm.name)) {
        const err = new Error('duplicate'); err.code = '23505'; throw err;
      }
      return result([farm]);
    }
    if (sql.includes('SELECT id FROM farms WHERE id = $1 FOR UPDATE')) {
      return result(state.farms.filter((f) => f.id === params[0]).map((f) => ({ id: f.id })));
    }
    if (sql.includes('SELECT COUNT(*)::int AS count FROM scout_reports WHERE farm_id = $1')) {
      const count = state.reports.filter((r) => r.farm_id === params[0]).length;
      return result([{ count }]);
    }
    if (sql.startsWith('DELETE FROM farms WHERE id = $1 RETURNING id')) {
      const index = state.farms.findIndex((f) => f.id === params[0]);
      if (index < 0) return result([]);
      const [farm] = state.farms.splice(index, 1);
      return result([{ id: farm.id }]);
    }
    if (sql.startsWith('SELECT pg_advisory_xact_lock')) return result([{ pg_advisory_xact_lock: null }]);
    throw new Error(`Unhandled SQL in farm test mock: ${sql}`);
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

  const store = require('./store');
  return { store, state };
}

test('farm CRUD store creates and lists farms with server-generated IDs', async () => {
  const { store, state } = loadStoreWithMockDb({
    farms: [{ id: 'FARM-001', name: 'Alpha', location: 'East' }],
  });

  const created = await store.createFarm({ name: 'Beta Farm', location: 'West' });
  assert.equal(created.id, 'FARM-002');
  assert.equal(created.name, 'Beta Farm');

  const farms = await store.getFarms();
  assert.equal(farms.length, 2);
  assert.ok(state.calls.some((c) => c.sql.includes('pg_advisory_xact_lock')));
});

test('farm create validates required fields and maps duplicates to 409', async () => {
  const { store } = loadStoreWithMockDb({
    farms: [{ id: 'FARM-001', name: 'Alpha', location: 'East' }],
  });

  await assert.rejects(() => store.createFarm({ name: '   ' }), (err) => err.statusCode === 400);
  await assert.rejects(() => store.createFarm({ name: 'Alpha' }), (err) => err.statusCode === 409);
});

test('farm update supports partial fields and rejects an empty patch', async () => {
  const { store } = loadStoreWithMockDb({
    farms: [
      { id: 'FARM-001', name: 'Alpha', location: 'East' },
      { id: 'FARM-002', name: 'Beta', location: 'West' },
    ],
  });

  const updated = await store.updateFarm('FARM-001', { location: 'Central' });
  assert.equal(updated.name, 'Alpha');
  assert.equal(updated.location, 'Central');
  assert.equal(await store.updateFarm('FARM-404', { name: 'Missing' }), null);
  await assert.rejects(() => store.updateFarm('FARM-001', {}), /At least one mutable farm field/);
  await assert.rejects(() => store.updateFarm('FARM-001', { name: 'Beta' }), (err) => err.statusCode === 409);
});

test('farm delete blocks farms referenced by scout reports', async () => {
  const { store, state } = loadStoreWithMockDb({
    farms: [{ id: 'FARM-001', name: 'Alpha', location: 'East' }],
    reports: [{ id: 'SR-000001', farm_id: 'FARM-001' }],
  });

  const result = await store.deleteFarm('FARM-001');
  assert.equal(result.deleted, false);
  assert.equal(result.reason, 'in_use');
  assert.equal(state.farms.length, 1);
});

test('farm delete removes an unused farm and reports missing farms', async () => {
  const { store, state } = loadStoreWithMockDb({
    farms: [{ id: 'FARM-001', name: 'Alpha', location: 'East' }],
  });

  const deleted = await store.deleteFarm('FARM-001');
  assert.deepEqual(deleted, { deleted: true, reason: 'deleted' });
  assert.equal(state.farms.length, 0);
  assert.deepEqual(await store.deleteFarm('FARM-404'), { deleted: false, reason: 'not_found' });
});
