const { test } = require('node:test');
const assert = require('node:assert');

function loadController(overrides = {}) {
  const storePath = require.resolve('./store');
  const controllerPath = require.resolve('./controllers/admin/reference.controller');
  delete require.cache[controllerPath];
  require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: {
    getPestsAdmin: async () => [{id:'PEST-001',name:'Aphid',description:null}],
    findPest: async () => ({id:'PEST-001',name:'Aphid',description:null}),
    createPest: async () => ({id:'PEST-002',name:'Whitefly',description:null}),
    updatePest: async () => ({id:'PEST-001',name:'Aphid',description:'Updated'}),
    deletePest: async () => ({deleted:true,reason:'deleted'}),
    ...overrides,
  }};
  return require('./controllers/admin/reference.controller');
}
function response(){ const out={statusCode:200,body:undefined,ended:false}; return {out,status(c){out.statusCode=c;return this;},json(b){out.body=b;return this;},end(){out.ended=true;return this;}}; }

test('admin pest controller handles list/create/get/update/delete', async () => {
  const c=loadController(); let r=response();
  await c.listPests({},r,assert.fail); assert.equal(r.out.statusCode,200);
  r=response(); await c.createPest({body:{name:'Whitefly'}},r,assert.fail); assert.equal(r.out.statusCode,201);
  r=response(); await c.getPest({params:{id:'PEST-001'}},r,assert.fail); assert.equal(r.out.statusCode,200);
  r=response(); await c.updatePest({params:{id:'PEST-001'},body:{description:'Updated'}},r,assert.fail); assert.equal(r.out.statusCode,200);
  r=response(); await c.deletePest({params:{id:'PEST-001'}},r,assert.fail); assert.equal(r.out.statusCode,204); assert.equal(r.out.ended,true);
});

test('admin pest controller maps missing pest to 404', async () => {
  const c=loadController({findPest:async()=>null,updatePest:async()=>null,deletePest:async()=>({deleted:false,reason:'not_found'})});
  let r=response(); await c.getPest({params:{id:'PEST-404'}},r,assert.fail); assert.equal(r.out.statusCode,404);
  r=response(); await c.updatePest({params:{id:'PEST-404'},body:{name:'Missing'}},r,assert.fail); assert.equal(r.out.statusCode,404);
  r=response(); await c.deletePest({params:{id:'PEST-404'}},r,assert.fail); assert.equal(r.out.statusCode,404);
});
