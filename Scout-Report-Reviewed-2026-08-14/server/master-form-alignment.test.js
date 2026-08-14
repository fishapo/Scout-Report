"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const form=fs.readFileSync(path.join(root,"previews/user-form.html"),"utf8");
const schema=require("../docs/phase22-master-import/master-import-schema.json");
const dictionary=require("../docs/next-phases/data-model/field-dictionary.json");
test("master spreadsheet has 38 canonical source columns",()=>{
 assert.equal(schema.columns.length,38);
 assert.deepEqual(schema.columns.slice(0,6).map(x=>x.source_heading),["WEEK","Farm","GH","Inpl. wk-year","Crop","Variety"]);
 assert.equal(schema.columns.at(-1).source_heading,"Others");
});
test("canonical dictionary remains 93 fields",()=>assert.equal(dictionary.fields.length,93));
test("Scout Report form contains all 38 master database keys",()=>{
 for(const c of schema.columns.slice(6)) assert.match(form,new RegExp(`data-master=["']${c.database_key}["']`),`missing ${c.database_key}`);
 for(const id of ["impl-week","farm-select","gh-value","inpl-wk-year","crop-select","variety-select"]) assert.match(form,new RegExp(`id=["']${id}["']`),`missing header control ${id}`);
});
test("Scout Report form exposes required farm choices and location modes",()=>{
 for(const name of ["FARM 1","FARM 2","FARM 3","FARM 4","FARM 5","FARM 6","FARM 7","FARM 8","FARM 9","FARM 10","FARM 11","FARM 12A","FARM 12B"]) assert.match(form,new RegExp(name.replace(/[ ]/g,"\\s+")));
 assert.doesNotMatch(form,/if\(\!f\)o\.disabled=true/,'farm options must never be greyed out when reference API has only a partial farm list');
 for(const mode of ["Field","Greenhouse","Shadenet"]) assert.match(form,new RegExp(`data-location=["']${mode}["']`));
 assert.doesNotMatch(form,/FARM-GREENHOUSE|FARM_CHOICES[^;]*GREENHOUSE/,"GREENHOUSE must be a location mode, not a farm choice");
});
test("form retains environment and GPS controls",()=>{
 for(const id of ["weather-select","temperature","humidity","soil-ph","irrigation-method","updateLocation","lat-display","long-display"]) assert.match(form,new RegExp(id));
});
test("crop selection uses nested spreadsheet-seeded varieties",()=>{
 assert.match(form,/Array\.isArray\(crop\?\.varieties\)/);
 assert.match(form,/loadVarietiesForCrop\(crop\)/);
 assert.match(form,/variety-select/);
 assert.match(form,/s\.disabled=false/);
});
test("form submits the selected spreadsheet crop name and only uses a live farm id",()=>{
 assert.match(form,/o\.dataset\.name=crop\.name/);
 assert.match(form,/const farmId=f\?\.dataset\.referenceOnly==='true'\?'':\(f\?\.value\|\|''\)/);
 assert.match(form,/const cropName=c\?\.dataset\.name\|\|''/);
 assert.match(form,/cropType:cropName/);
});
test("spreadsheet pest and disease reference labels are present",()=>{
 for(const name of ["Thrips","Leaf Miner","White Fly","Aphids","Spider Mite","Beetles","Caterpillar","Butterflies","Sciara Fly","Cut Worms","Mealy Bugs","Slugs","Snails","Nematodes"]) assert.match(form,new RegExp(name));
 for(const name of ["Chlorosis","Fusarium","Rhizoctonia","Powdery mildew","Botrytis","Leafspot — Black","Leafspot — Brown"]) assert.match(form,new RegExp(name.replace(/[ —]/g,m=>m==="—"?"\\s*[—-]\\s*":"\\s*")));
});
