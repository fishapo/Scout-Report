const { test } = require('node:test');
const assert = require('node:assert');
function loadController(overrides={}) {
  const storePath=require.resolve('./store'); const controllerPath=require.resolve('./controllers/admin/reference.controller');
  delete require.cache[controllerPath];
  require.cache[storePath]={id:storePath,filename:storePath,loaded:true,exports:{
    getCropTypesAdmin:async()=>[{id:'CROP-001',name:'Tomato'}], findCropType:async()=>({id:'CROP-001',name:'Tomato'}),
    createCropType:async()=>({id:'CROP-002',name:'Pepper'}), updateCropType:async()=>({id:'CROP-001',name:'Tomato Updated'}),
    deleteCropType:async()=>({deleted:true,reason:'deleted'}), ...overrides }};
  return require('./controllers/admin/reference.controller');
}
function response(){const out={statusCode:200,body:undefined,ended:false}; return {out,status(c){out.statusCode=c;return this;},json(b){out.body=b;return this;},end(){out.ended=true;return this;}};}

test('admin crop controller handles list/create/get/update', async()=>{
  const c=loadController(); let r=response(); await c.listCropTypes({},r,assert.fail); assert.equal(r.out.statusCode,200); assert.equal(r.out.body.data[0].name,'Tomato');
  r=response(); await c.createCropType({body:{name:'Pepper'}},r,assert.fail); assert.equal(r.out.statusCode,201);
  r=response(); await c.getCropType({params:{id:'CROP-001'}},r,assert.fail); assert.equal(r.out.statusCode,200);
  r=response(); await c.updateCropType({params:{id:'CROP-001'},body:{name:'Tomato Updated'}},r,assert.fail); assert.equal(r.out.statusCode,200);
});
test('admin crop controller maps not-found and dependency conflict', async()=>{
  let c=loadController({findCropType:async()=>null,updateCropType:async()=>null}); let r=response(); await c.getCropType({params:{id:'CROP-404'}},r,assert.fail); assert.equal(r.out.statusCode,404); r=response(); await c.updateCropType({params:{id:'CROP-404'},body:{name:'x'}},r,assert.fail); assert.equal(r.out.statusCode,404);
  c=loadController({deleteCropType:async()=>({deleted:false,reason:'in_use',dependencyCount:2})}); r=response(); await c.deleteCropType({params:{id:'CROP-001'}},r,assert.fail); assert.equal(r.out.statusCode,409); assert.equal(r.out.body.error.dependencyCount,2);
});
test('admin crop controller returns 204 for successful delete', async()=>{const c=loadController();const r=response();await c.deleteCropType({params:{id:'CROP-001'}},r,assert.fail);assert.equal(r.out.statusCode,204);assert.equal(r.out.ended,true);});
