const { test } = require('node:test');
const assert = require('node:assert');

function loadController(overrides = {}) {
  const storePath = require.resolve('./store');
  const controllerPath = require.resolve('./controllers/admin/reference.controller');
  delete require.cache[controllerPath];
  require.cache[storePath] = {
    id: storePath,
    filename: storePath,
    loaded: true,
    exports: {
      getFarms: async () => [{ id: 'FARM-001', name: 'Alpha', location: 'East' }],
      findFarm: async () => ({ id: 'FARM-001', name: 'Alpha', location: 'East' }),
      createFarm: async () => ({ id: 'FARM-002', name: 'Beta', location: 'West' }),
      updateFarm: async () => ({ id: 'FARM-001', name: 'Alpha Updated', location: 'Central' }),
      deleteFarm: async () => ({ deleted: true, reason: 'deleted' }),
      ...overrides,
    },
  };
  return require('./controllers/admin/reference.controller');
}

function response() {
  const out = { statusCode: 200, body: undefined, ended: false };
  return {
    out,
    status(code) { out.statusCode = code; return this; },
    json(body) { out.body = body; return this; },
    end() { out.ended = true; return this; },
  };
}

test('admin reference controller returns wrapped farm list/create/update responses', async () => {
  const controller = loadController();
  const res1 = response();
  await controller.listFarms({}, res1, assert.fail);
  assert.equal(res1.out.statusCode, 200);
  assert.equal(res1.out.body.success, true);

  const res2 = response();
  await controller.createFarm({ body: { name: 'Beta' } }, res2, assert.fail);
  assert.equal(res2.out.statusCode, 201);
  assert.equal(res2.out.body.data.id, 'FARM-002');

  const res3 = response();
  await controller.updateFarm({ params: { id: 'FARM-001' }, body: { name: 'Alpha Updated' } }, res3, assert.fail);
  assert.equal(res3.out.statusCode, 200);
  assert.equal(res3.out.body.data.name, 'Alpha Updated');
});

test('admin reference controller maps missing farm to 404', async () => {
  const controller = loadController({ findFarm: async () => null, updateFarm: async () => null });
  const res1 = response();
  await controller.getFarm({ params: { id: 'FARM-404' } }, res1, assert.fail);
  assert.equal(res1.out.statusCode, 404);
  assert.equal(res1.out.body.error.code, 'REFERENCE_NOT_FOUND');

  const res2 = response();
  await controller.updateFarm({ params: { id: 'FARM-404' }, body: { name: 'Missing' } }, res2, assert.fail);
  assert.equal(res2.out.statusCode, 404);
});

test('admin reference controller maps in-use farm delete to 409', async () => {
  const controller = loadController({
    deleteFarm: async () => ({ deleted: false, reason: 'in_use', dependencyCount: 2 }),
  });
  const res = response();
  await controller.deleteFarm({ params: { id: 'FARM-001' } }, res, assert.fail);
  assert.equal(res.out.statusCode, 409);
  assert.equal(res.out.body.error.code, 'REFERENCE_IN_USE');
  assert.equal(res.out.body.error.dependencyCount, 2);
});

test('admin reference controller returns 204 for successful farm deletion', async () => {
  const controller = loadController();
  const res = response();
  await controller.deleteFarm({ params: { id: 'FARM-001' } }, res, assert.fail);
  assert.equal(res.out.statusCode, 204);
  assert.equal(res.out.ended, true);
});
