const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');

function loadClient(handler) {
  const source = fs.readFileSync(__dirname + '/admin-reference.js', 'utf8');
  const auth = { fetchWithAuth: handler };
  const window = {};
  const sandbox = vm.createContext({ window, encodeURIComponent, Error });
  vm.runInContext(source, sandbox, { filename: 'admin-reference.js' });
  return new sandbox.window.AdminReferenceClient(auth);
}

function response(status, body) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

test('admin reference client sends authenticated farm create and unwraps data', async () => {
  const calls = [];
  const client = loadClient(async (path, options) => {
    calls.push({ path, options });
    return response(201, { success: true, data: { id: 'FARM-001', name: 'North Farm' } });
  });
  const result = await client.create('farms', { name: 'North Farm' });
  assert.equal(result.id, 'FARM-001');
  assert.equal(calls[0].path, '/api/admin/reference/farms');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].options.body), { name: 'North Farm' });
});

test('admin reference client handles dependency-protected delete errors', async () => {
  const client = loadClient(async () => response(409, {
    success: false,
    error: { code: 'REFERENCE_IN_USE', message: 'Farm is in use', dependencyCount: 3 },
  }));
  await assert.rejects(() => client.remove('farms', 'FARM-001'), error => {
    assert.equal(error.status, 409);
    assert.equal(error.code, 'REFERENCE_IN_USE');
    assert.equal(error.dependencyCount, 3);
    return true;
  });
});

test('admin reference client handles 204 deletes without parsing JSON', async () => {
  const client = loadClient(async () => response(204, null));
  assert.equal(await client.removeVariety('CROP-001', 7), null);
});

test('admin reference client keeps variety parent scoped', async () => {
  const calls = [];
  const client = loadClient(async (path, options) => {
    calls.push({ path, options });
    return response(200, { success: true, data: { id: 7, crop_type_id: 'CROP-001', name: 'Maize A' } });
  });
  await client.updateVariety('CROP-001', 7, { name: 'Maize B' });
  assert.equal(calls[0].path, '/api/admin/reference/crop-types/CROP-001/varieties/7');
  assert.equal(calls[0].options.method, 'PATCH');
});
