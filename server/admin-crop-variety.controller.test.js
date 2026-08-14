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
      getCropVarietiesAdmin: async () => [{ id: 1, crop_type_id: 'CROP-001', name: 'Cherry Tomato' }],
      findCropType: async () => ({ id: 'CROP-001', name: 'Tomato' }),
      findCropVariety: async () => ({ id: 1, crop_type_id: 'CROP-001', name: 'Cherry Tomato' }),
      createCropVariety: async () => ({ id: 2, crop_type_id: 'CROP-001', name: 'Roma Tomato' }),
      updateCropVariety: async () => ({ id: 1, crop_type_id: 'CROP-001', name: 'Roma Tomato' }),
      deleteCropVariety: async () => ({ deleted: true, reason: 'deleted' }),
      ...overrides,
    },
  };
  return require('./controllers/admin/reference.controller');
}

function response() {
  const out = { statusCode: 200, body: undefined, ended: false };
  return {
    out,
    status(c) { out.statusCode = c; return this; },
    json(b) { out.body = b; return this; },
    end() { out.ended = true; return this; },
  };
}

test('admin variety controller handles list/create/get/update/delete', async () => {
  const c = loadController();
  let r = response();
  await c.listCropVarieties({ params: { cropTypeId: 'CROP-001' } }, r, assert.fail);
  assert.equal(r.out.statusCode, 200);
  r = response();
  await c.createCropVariety({ params: { cropTypeId: 'CROP-001' }, body: { name: 'Roma Tomato' } }, r, assert.fail);
  assert.equal(r.out.statusCode, 201);
  r = response();
  await c.getCropVariety({ params: { cropTypeId: 'CROP-001', id: '1' } }, r, assert.fail);
  assert.equal(r.out.statusCode, 200);
  r = response();
  await c.updateCropVariety({ params: { cropTypeId: 'CROP-001', id: '1' }, body: { name: 'Roma Tomato' } }, r, assert.fail);
  assert.equal(r.out.statusCode, 200);
  r = response();
  await c.deleteCropVariety({ params: { cropTypeId: 'CROP-001', id: '1' } }, r, assert.fail);
  assert.equal(r.out.statusCode, 204);
  assert.equal(r.out.ended, true);
});

test('admin variety controller maps missing parent and variety', async () => {
  let c = loadController({ findCropType: async () => null, getCropVarietiesAdmin: async () => null });
  let r = response();
  await c.listCropVarieties({ params: { cropTypeId: 'CROP-404' } }, r, assert.fail);
  assert.equal(r.out.statusCode, 404);
  c = loadController({ findCropType: async () => ({ id: 'CROP-001' }), findCropVariety: async () => null });
  r = response();
  await c.getCropVariety({ params: { cropTypeId: 'CROP-001', id: '999' } }, r, assert.fail);
  assert.equal(r.out.statusCode, 404);
});
