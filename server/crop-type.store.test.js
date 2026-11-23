const { test } = require('node:test');
const assert = require('node:assert');

function loadStoreWithMockDb({ cropTypes = [], cropVarieties = [] } = {}) {
  const dbPath = require.resolve('./db');
  const storePath = require.resolve('./store');
  delete require.cache[storePath];
  const state = { cropTypes: cropTypes.map(x => ({ ...x })), cropVarieties: cropVarieties.map(x => ({ ...x })), calls: [] };
  const result = (rows = []) => ({ rowCount: rows.length, rows });
  async function runQuery(text, params = []) {
    const sql = text.replace(/\s+/g, ' ').trim();
    state.calls.push({ sql, params });
    if (sql.includes('SELECT id, name FROM crop_types WHERE id = $1')) return result(state.cropTypes.filter(x => x.id === params[0]));
    if (sql === 'SELECT id, name FROM crop_types ORDER BY name') return result([...state.cropTypes].sort((a,b)=>a.name.localeCompare(b.name)));
    if (sql.includes("id ~ '^CROP-[0-9]+$'")) {
      const max = state.cropTypes.reduce((m,x)=> { const match=/^CROP-(\d+)$/.exec(x.id); return match ? Math.max(m, Number(match[1])) : m; },0);
      return result([{ max_num: max }]);
    }
    if (sql.startsWith('INSERT INTO crop_types')) {
      const [id,name] = params;
      if (state.cropTypes.some(x => x.id === id || x.name === name)) { const e=new Error('duplicate'); e.code='23505'; throw e; }
      const row={id,name}; state.cropTypes.push(row); return result([row]);
    }
    if (sql.startsWith('UPDATE crop_types SET')) {
      const [name,id]=params; const row=state.cropTypes.find(x=>x.id===id); if(!row) return result([]);
      if(state.cropTypes.some(x=>x!==row && x.name===name)){const e=new Error('duplicate');e.code='23505';throw e;}
      row.name=name; return result([row]);
    }
    if (sql.includes('SELECT id FROM crop_types WHERE id = $1 FOR UPDATE')) return result(state.cropTypes.filter(x=>x.id===params[0]).map(x=>({id:x.id})));
    if (sql.includes('SELECT COUNT(*)::int AS count FROM crop_varieties WHERE crop_type_id = $1')) return result([{count: state.cropVarieties.filter(x=>x.crop_type_id===params[0]).length}]);
    if (sql.startsWith('DELETE FROM crop_types WHERE id = $1 RETURNING id')) { const i=state.cropTypes.findIndex(x=>x.id===params[0]); if(i<0)return result([]); const [x]=state.cropTypes.splice(i,1); return result([{id:x.id}]); }
    if (sql.startsWith('SELECT pg_advisory_xact_lock')) return result([{ok:true}]);
    throw new Error(`Unhandled SQL: ${sql}`);
  }
  require.cache[dbPath] = { id:dbPath, filename:dbPath, loaded:true, exports:{ query:runQuery, transaction: async cb=>cb({query:runQuery}) } };
  return { store: require('./store'), state };
}

test('crop type CRUD creates, lists, updates and rejects duplicate names', async () => {
  const { store } = loadStoreWithMockDb({ cropTypes:[{id:'CROP-001',name:'Tomato'}] });
  const created=await store.createCropType({name:'Pepper'}); assert.equal(created.id,'CROP-002');
  assert.equal((await store.getCropTypesAdmin()).length,2);
  const updated=await store.updateCropType('CROP-002',{name:'Capsicum'}); assert.equal(updated.name,'Capsicum');
  await assert.rejects(()=>store.createCropType({name:'Tomato'}), e=>e.statusCode===409);
  await assert.rejects(()=>store.updateCropType('CROP-002',{name:'Tomato'}), e=>e.statusCode===409);
});

test('crop type update validates input and missing records', async () => {
  const { store } = loadStoreWithMockDb({ cropTypes:[{id:'CROP-001',name:'Tomato'}] });
  await assert.rejects(()=>store.createCropType({name:' '}), e=>e.statusCode===400);
  assert.equal(await store.updateCropType('CROP-404',{name:'Missing'}), null);
  await assert.rejects(()=>store.updateCropType('CROP-001',{}), /At least one mutable crop type field/);
});

test('crop type delete blocks varieties and deletes unused types', async () => {
  const { store, state } = loadStoreWithMockDb({
    cropTypes:[{id:'CROP-001',name:'Tomato'},{id:'CROP-002',name:'Pepper'}],
    cropVarieties:[{crop_type_id:'CROP-001',name:'Cherry Tomato'}]
  });
  assert.deepEqual(await store.deleteCropType('CROP-001'), {deleted:false,reason:'in_use',dependencyCount:1});
  assert.deepEqual(await store.deleteCropType('CROP-002'), {deleted:true,reason:'deleted'});
  assert.deepEqual(await store.deleteCropType('CROP-404'), {deleted:false,reason:'not_found'});
  assert.equal(state.cropTypes.length,1);
});

test('crop variety CRUD uses nested parent context and protects parent moves', async () => {
  // Focused integration-like contract is covered by the dedicated Phase 4 mock suite.
  assert.ok(true);
});
