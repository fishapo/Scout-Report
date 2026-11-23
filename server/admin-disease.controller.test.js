const { test } = require('node:test');
const assert = require('node:assert');
function loadController(overrides = {}) {
  const storePath = require.resolve('./store');
  const controllerPath = require.resolve('./controllers/admin/reference.controller');
  delete require.cache[controllerPath];
  require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: {
    getDiseasesAdmin: async () => [{id:'DISEASE-001',name:'Blight',description:null}],
    findDisease: async () => ({id:'DISEASE-001',name:'Blight',description:null}),
    createDisease: async () => ({id:'DISEASE-002',name:'Mildew',description:null}),
    updateDisease: async () => ({id:'DISEASE-001',name:'Blight',description:'Updated'}),
    deleteDisease: async () => ({deleted:true,reason:'deleted'}),
    ...overrides,
  }};
  return require('./controllers/admin/reference.controller');
}
function response(){ const out={statusCode:200,body:undefined,ended:false}; return {out,status(c){out.statusCode=c;return this;},json(b){out.body=b;return this;},end(){out.ended=true;return this;}}; }

test('admin disease controller handles list/create/get/update/delete', async () => {
  const c=loadController(); let r=response();
  await c.listDiseases({},r,assert.fail); assert.equal(r.out.statusCode,200);
  r=response(); await c.createDisease({body:{name:'Mildew'}},r,assert.fail); assert.equal(r.out.statusCode,201);
  r=response(); await c.getDisease({params:{id:'DISEASE-001'}},r,assert.fail); assert.equal(r.out.statusCode,200);
  r=response(); await c.updateDisease({params:{id:'DISEASE-001'},body:{description:'Updated'}},r,assert.fail); assert.equal(r.out.statusCode,200);
  r=response(); await c.deleteDisease({params:{id:'DISEASE-001'}},r,assert.fail); assert.equal(r.out.statusCode,204); assert.equal(r.out.ended,true);
});

test('admin disease controller maps missing disease to 404', async () => {
  const c=loadController({findDisease:async()=>null,updateDisease:async()=>null,deleteDisease:async()=>({deleted:false,reason:'not_found'})});
  let r=response(); await c.getDisease({params:{id:'DISEASE-404'}},r,assert.fail); assert.equal(r.out.statusCode,404);
  r=response(); await c.updateDisease({params:{id:'DISEASE-404'},body:{name:'Missing'}},r,assert.fail); assert.equal(r.out.statusCode,404);
  r=response(); await c.deleteDisease({params:{id:'DISEASE-404'}},r,assert.fail); assert.equal(r.out.statusCode,404);
});
