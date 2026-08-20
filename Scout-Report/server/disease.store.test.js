const { test } = require('node:test');
const assert = require('node:assert');

function loadStoreWithMockDb({ diseases = [] } = {}) {
  const dbPath = require.resolve('./db');
  const storePath = require.resolve('./store');
  delete require.cache[storePath];
  const state = { diseases: diseases.map(x => ({ ...x })), calls: [] };
  const result = (rows = []) => ({ rowCount: rows.length, rows });
  async function runQuery(text, params = []) {
    const sql = text.replace(/\s+/g, ' ').trim();
    state.calls.push({ sql, params });
    if (sql === 'SELECT id, name, description FROM diseases ORDER BY name, id') return result([...state.diseases].sort((a,b)=>a.name.localeCompare(b.name)));
    if (sql === 'SELECT id, name, description FROM diseases WHERE id = $1') return result(state.diseases.filter(x => x.id === params[0]));
    if (sql.includes("id ~ '^DISEASE-[0-9]+$'")) {
      const max = state.diseases.reduce((m,x)=> { const match=/^DISEASE-(\d+)$/.exec(x.id); return match ? Math.max(m, Number(match[1])) : m; },0);
      return result([{ max_num: max }]);
    }
    if (sql.startsWith('SELECT pg_advisory_xact_lock')) return result([{ok:true}]);
    if (sql.startsWith('INSERT INTO diseases')) {
      const [id,name,description] = params;
      if (state.diseases.some(x => x.id === id || x.name === name)) { const e=new Error('duplicate'); e.code='23505'; throw e; }
      const row={id,name,description}; state.diseases.push(row); return result([row]);
    }
    if (sql.startsWith('UPDATE diseases SET')) {
      const id=params[params.length-1]; const row=state.diseases.find(x=>x.id===id); if(!row)return result([]);
      const name=params.length===3?params[0]:row.name; const description=params.length===3?params[1]:params[0];
      if(state.diseases.some(x=>x!==row && x.name===name)){const e=new Error('duplicate');e.code='23505';throw e;}
      row.name=name; row.description=description; return result([row]);
    }
    if (sql === 'SELECT id FROM diseases WHERE id = $1 FOR UPDATE') return result(state.diseases.filter(x=>x.id===params[0]).map(x=>({id:x.id})));
    if (sql.startsWith('DELETE FROM diseases WHERE id = $1 RETURNING id')) { const i=state.diseases.findIndex(x=>x.id===params[0]); if(i<0)return result([]); const [x]=state.diseases.splice(i,1); return result([{id:x.id}]); }
    throw new Error(`Unhandled SQL: ${sql}`);
  }
  require.cache[dbPath] = { id:dbPath, filename:dbPath, loaded:true, exports:{ query:runQuery, transaction: async cb=>cb({query:runQuery}) } };
  return { store: require('./store'), state };
}

test('disease CRUD creates, lists, updates and deletes', async () => {
  const { store } = loadStoreWithMockDb({ diseases:[{id:'DISEASE-001',name:'Blight',description:'Fungal disease'}] });
  const created=await store.createDisease({name:'Mildew',description:'Powdery disease'}); assert.equal(created.id,'DISEASE-002');
  assert.equal((await store.getDiseasesAdmin()).length,2);
  const updated=await store.updateDisease('DISEASE-002',{name:'Rust',description:'Updated'}); assert.equal(updated.name,'Rust');
  assert.deepEqual(await store.deleteDisease('DISEASE-002'), {deleted:true,reason:'deleted',id:'DISEASE-002'});
});

test('disease CRUD validates missing, duplicate and invalid input', async () => {
  const { store } = loadStoreWithMockDb({ diseases:[{id:'DISEASE-001',name:'Blight',description:null}] });
  await assert.rejects(()=>store.createDisease({name:' '}), e=>e.statusCode===400);
  await assert.rejects(()=>store.createDisease({name:'Blight'}), e=>e.statusCode===409);
  assert.equal(await store.updateDisease('DISEASE-404',{name:'Missing'}), null);
  assert.deepEqual(await store.deleteDisease('DISEASE-404'), {deleted:false,reason:'not_found'});
});

test('disease deletion is independent of historical text observations', async () => {
  const { store, state } = loadStoreWithMockDb({ diseases:[{id:'DISEASE-001',name:'Blight',description:null}] });
  assert.deepEqual(await store.deleteDisease('DISEASE-001'), {deleted:true,reason:'deleted',id:'DISEASE-001'});
  assert.equal(state.diseases.length,0);
});
