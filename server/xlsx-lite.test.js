"use strict";
const test=require("node:test");const assert=require("node:assert/strict");const {createWorkbook,readWorkbook}=require("./xlsx-lite");
test("xlsx-lite round trips a report worksheet",()=>{const input=[["id","farmName","cropType"],["SR-000001","Green Valley","Tomato"],["SR-000002","Sunset","Pepper"]];const rows=readWorkbook(createWorkbook(input));assert.deepEqual(rows,input)});
