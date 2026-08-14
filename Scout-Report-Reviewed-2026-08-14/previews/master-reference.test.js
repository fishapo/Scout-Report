const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const catalog=require(path.join(root,"server/data/master-crop-catalog.json"));
const form=fs.readFileSync(path.join(__dirname,"user-form.html"),"utf8");
test("latest master spreadsheet crop catalog is embedded with 130 crop types",()=>{assert.equal(catalog.cropTypeCount,130);assert.equal(catalog.crops.length,130);assert.equal(catalog.varietyPairCount,3475)});
test("every catalog crop has spreadsheet-tied varieties with source codes",()=>{for(const crop of catalog.crops){assert.ok(crop.name);assert.ok(crop.codes.length);for(const v of crop.varieties){assert.ok(v.name);assert.ok(v.code);assert.ok(crop.codes.includes(v.code))}}});
test("form uses spreadsheet master crop catalog and active GH field",()=>{assert.ok(form.includes("REFERENCE_API+'/master-crops'"));assert.match(form,/function populateMasterCrops\(\)/);assert.match(form,/function loadVarietiesForCrop\(crop\)/);assert.match(form,/id="gh-value" value="" placeholder="Enter greenhouse number" autocomplete="off"/);assert.doesNotMatch(form,/id="gh-value"[^>]*disabled/);assert.match(form,/gh\.disabled=false/);assert.match(form,/Greenhouse mode requires the GH/)});
test("form exposes separate disease and other-condition references",()=>{assert.match(form,/id="disease-reference-select"/);assert.match(form,/id="stress-reference-select"/);assert.ok(form.includes("REFERENCE_API+'/stress-references'"))});
test("form no longer labels the save action as a draft",()=>{assert.doesNotMatch(form,/onclick="saveDraft\(\)"/);assert.match(form,/onclick="saveReportOnly\(\)"/)});

const referenceMapping=require("./js/reference-mapping.js");

test("pest observation labels resolve to live reference IDs despite master spelling differences",()=>{
  const refs=[
    {id:"PST-001",name:"Thrips"},
    {id:"PST-004",name:"Aphids"},
    {id:"PST-007",name:"Cater Pillar"},
    {id:"PST-008",name:"Butter Flies"},
    {id:"PST-014",name:"Nema Todes"}
  ];
  assert.equal(referenceMapping.resolveObservationReference("caterpillar_spots","Caterpillar",refs,{"caterpillar_spots":["Cater Pillar"]}),"PST-007");
  assert.equal(referenceMapping.resolveObservationReference("butterflies_counting","Butterflies",refs,{"butterflies_counting":["Butter Flies"]}),"PST-008");
  assert.equal(referenceMapping.resolveObservationReference("nematodes_spots","Nematodes",refs,{"nematodes_spots":["Nema Todes"]}),"PST-014");
  assert.equal(referenceMapping.resolveObservationReference("aphids_nymphs","Aphids",refs,{}),"PST-004");
});

test("disease observation labels resolve to authoritative master reference IDs",()=>{
  const refs=[
    {id:"DIS-001",name:"Chlo Rosis Spots/Mp"},
    {id:"DIS-003",name:"Rhyzoc Tonia"},
    {id:"DIS-005",name:"Botrytis Spots/Mp"}
  ];
  assert.equal(referenceMapping.resolveObservationReference("chlorosis_spots_mp","Chlorosis",refs,{"chlorosis_spots_mp":["Chlo Rosis Spots/Mp"]}),"DIS-001");
  assert.equal(referenceMapping.resolveObservationReference("rhizoctonia_mp","Rhizoctonia",refs,{"rhizoctonia_mp":["Rhyzoc Tonia"]}),"DIS-003");
  assert.equal(referenceMapping.resolveObservationReference("botrytis_spots_mp","Botrytis",refs,{"botrytis_spots_mp":["Botrytis Spots/Mp"]}),"DIS-005");
});

test("form submission uses live reference mapping instead of raw spreadsheet pest/disease labels",()=>{
  assert.match(form,/referencePests=\[\]/);
  assert.match(form,/referenceDiseases=\[\]/);
  assert.match(form,/scoutReferenceMapping\.resolveObservationReference/);
  assert.doesNotMatch(form,/pestType:x\.t,count:x\.v/);
  assert.doesNotMatch(form,/diseaseType:x\.t,severity/);
});
