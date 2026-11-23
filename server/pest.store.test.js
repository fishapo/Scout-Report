const { test } = require('node:test');
const assert = require('node:assert');

function loadStoreWithMockDb({ pests = [] } = {}) {
  const dbPath = require.resolve('./db');
  const storePath = require.resolve('./store');
  delete require.cache[storePath];
  const state = { pests: pests.map(x => ({ ...x })), calls: [] };
  const result = (rows = []) => ({ rowCount: rows.length, rows });
  async function runQuery(text, params = []) {
    const sql = text.replace(/\s+/g, ' ').trim();
    state.calls.push({ sql, params });
    if (sql === 'SELECT id, name, description FROM pests ORDER BY name, id') return result([...state.pests].sort((a,b)=>a.name.localeCompare(b.name)));
    if (sql === 'SELECT id, name, description FROM pests WHERE id = $1') return result(state.pests.filter(x => x.id === params[0]));
    if (sql.includes("id ~ '^PEST-[0-9]+$'")) {
      const max = state.pests.reduce((m,x)=> { const match=/^PEST-(\d+)$/.exec(x.id); return match ? Math.max(m, Number(match[1])) : m; },0);
      return result([{ max_num: max }]);
    }
    if (sql.startsWith('SELECT pg_advisory_xact_lock')) return result([{ok:true}]);
    if (sql.startsWith('INSERT INTO pests')) {
      const [id,name,description] = params;
      if (state.pests.some(x => x.id === id || x.name === name)) { const e=new Error('duplicate'); e.code='23505'; throw e; }
      const row={id,name,description}; state.pests.push(row); return result([row]);
    }
    if (sql.startsWith('UPDATE pests SET')) {
      const id=params[params.length-1]; const row=state.pests.find(x=>x.id===id); if(!row)return result([]);
      const name=params.length===3?params[0]:row.name; const description=params.length===3?params[1]:params[0];
      if(state.pests.some(x=>x!==row && x.name===name)){const e=new Error('duplicate');e.code='23505';throw e;}
      row.name=name; row.description=description; return result([row]);
    }
    if (sql === 'SELECT id FROM pests WHERE id = $1 FOR UPDATE') return result(state.pests.filter(x=>x.id===params[0]).map(x=>({id:x.id})));
    if (sql.startsWith('DELETE FROM pests WHERE id = $1 RETURNING id')) { const i=state.pests.findIndex(x=>x.id===params[0]); if(i<0)return result([]); const [x]=state.pests.splice(i,1); return result([{id:x.id}]); }
    throw new Error(`Unhandled SQL: ${sql}`);
  }
  require.cache[dbPath] = { id:dbPath, filename:dbPath, loaded:true, exports:{ query:runQuery, transaction: async cb=>cb({query:runQuery}) } };
  return { store: require('./store'), state };
}

test('pest CRUD creates, lists, updates and deletes', async () => {
  const { store } = loadStoreWithMockDb({ pests:[{id:'PEST-001',name:'Aphid',description:'Small insect'}] });
  const created=await store.createPest({name:'Whitefly',description:'White insect'}); assert.equal(created.id,'PEST-002');
  assert.equal((await store.getPestsAdmin()).length,2);
  const updated=await store.updatePest('PEST-002',{name:'Thrips',description:'Thin insects'}); assert.equal(updated.name,'Thrips');
  assert.deepEqual(await store.deletePest('PEST-002'), {deleted:true,reason:'deleted',id:'PEST-002'});
});

test('pest CRUD validates missing, duplicate and invalid input', async () => {
  const { store } = loadStoreWithMockDb({ pests:[{id:'PEST-001',name:'Aphid',description:null}] });
  await assert.rejects(()=>store.createPest({name:' '}), e=>e.statusCode===400);
  await assert.rejects(()=>store.createPest({name:'Aphid'}), e=>e.statusCode===409);
  assert.equal(await store.updatePest('PEST-404',{name:'Missing'}), null);
  assert.deepEqual(await store.deletePest('PEST-404'), {deleted:false,reason:'not_found'});
});

test('pest deletion is independent of historical text observations', async () => {
  const { store, state } = loadStoreWithMockDb({ pests:[{id:'PEST-001',name:'Aphid',description:null}] });
  assert.deepEqual(await store.deletePest('PEST-001'), {deleted:true,reason:'deleted',id:'PEST-001'});
  assert.equal(state.pests.length,0);
});
