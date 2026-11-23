const { test } = require('node:test');
const assert = require('node:assert');

function loadStoreWithMockDb({ cropTypes = [], varieties = [] } = {}) {
  const dbPath = require.resolve('./db');
  const storePath = require.resolve('./store');
  delete require.cache[storePath];
  const state = { cropTypes: cropTypes.map(x=>({...x})), varieties: varieties.map(x=>({...x})) };
  const result = (rows=[]) => ({rowCount:rows.length, rows});
  async function runQuery(text, params=[]) {
    const sql=text.replace(/\s+/g,' ').trim();
    if (sql==='SELECT id, name FROM crop_types WHERE id = $1') return result(state.cropTypes.filter(x=>x.id===params[0]));
    if (sql.includes('SELECT id, crop_type_id, name FROM crop_varieties WHERE crop_type_id = $1 ORDER BY name, id')) return result(state.varieties.filter(x=>x.crop_type_id===params[0]).sort((a,b)=>a.name.localeCompare(b.name)||a.id-b.id));
    if (sql.includes('SELECT id, crop_type_id, name FROM crop_varieties WHERE crop_type_id = $1 AND id = $2')) return result(state.varieties.filter(x=>x.crop_type_id===params[0]&&x.id===params[1]));
    if (sql.startsWith('INSERT INTO crop_varieties')) { const [crop_type_id,name]=params; if(!state.cropTypes.some(x=>x.id===crop_type_id)){const e=new Error('fk');e.code='23503';throw e;} if(state.varieties.some(x=>x.crop_type_id===crop_type_id&&x.name===name)){const e=new Error('duplicate');e.code='23505';throw e;} const row={id:state.varieties.reduce((m,x)=>Math.max(m,x.id),0)+1,crop_type_id,name};state.varieties.push(row);return result([row]); }
    if (sql.startsWith('UPDATE crop_varieties SET name')) { const [name,crop_type_id,id]=params; const row=state.varieties.find(x=>x.crop_type_id===crop_type_id&&x.id===id); if(!row)return result([]); if(state.varieties.some(x=>x!==row&&x.crop_type_id===crop_type_id&&x.name===name)){const e=new Error('duplicate');e.code='23505';throw e;} row.name=name;return result([row]); }
    if (sql.startsWith('DELETE FROM crop_varieties')) { const [crop_type_id,id]=params; const i=state.varieties.findIndex(x=>x.crop_type_id===crop_type_id&&x.id===id);if(i<0)return result([]);const [row]=state.varieties.splice(i,1);return result([{id:row.id}]); }
    throw new Error('Unhandled SQL: '+sql);
  }
  require.cache[dbPath]={id:dbPath,filename:dbPath,loaded:true,exports:{query:runQuery,transaction:async cb=>cb({query:runQuery})}};
  return {store:require('./store'),state};
}

test('variety list and create validate parent and preserve nested context', async()=>{
  const {store}=loadStoreWithMockDb({cropTypes:[{id:'CROP-001',name:'Tomato'}]});
  assert.deepEqual(await store.getCropVarietiesAdmin('CROP-001'),[]);
  const row=await store.createCropVariety('CROP-001',{name:'Cherry Tomato'});
  assert.equal(row.crop_type_id,'CROP-001'); assert.equal(row.name,'Cherry Tomato');
  await assert.rejects(()=>store.createCropVariety('CROP-404',{name:'X'}),e=>e.statusCode===404);
});

test('variety duplicate and validation are rejected', async()=>{
  const {store}=loadStoreWithMockDb({cropTypes:[{id:'CROP-001',name:'Tomato'}],varieties:[{id:1,crop_type_id:'CROP-001',name:'Cherry Tomato'}]});
  await assert.rejects(()=>store.createCropVariety('CROP-001',{name:'Cherry Tomato'}),e=>e.statusCode===409);
  await assert.rejects(()=>store.createCropVariety('CROP-001',{name:' '}),e=>e.statusCode===400);
  await assert.rejects(()=>store.updateCropVariety('CROP-001',1,{crop_type_id:'CROP-002'}),e=>e.statusCode===400);
});

test('variety update and delete are parent-scoped', async()=>{
  const {store,state}=loadStoreWithMockDb({cropTypes:[{id:'CROP-001',name:'Tomato'},{id:'CROP-002',name:'Pepper'}],varieties:[{id:1,crop_type_id:'CROP-001',name:'Cherry Tomato'},{id:2,crop_type_id:'CROP-002',name:'Bell Pepper'}]});
  const updated=await store.updateCropVariety('CROP-001',1,{name:'Roma Tomato'}); assert.equal(updated.name,'Roma Tomato');
  assert.equal(await store.findCropVariety('CROP-002',1),null);
  assert.deepEqual(await store.deleteCropVariety('CROP-001',1),{deleted:true,reason:'deleted',id:1});
  assert.deepEqual(await store.deleteCropVariety('CROP-001',999),{deleted:false,reason:'not_found'});
  assert.equal(state.varieties.length,1);
});
