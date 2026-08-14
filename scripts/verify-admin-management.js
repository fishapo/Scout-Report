#!/usr/bin/env node
"use strict";
const fs=require("fs");
const path=require("path");
const html=fs.readFileSync(path.join(__dirname,"..","previews","admin-dashboard.html"),"utf8");
const required=[
  'id="analytics"','id="user-settings"','id="analytics-total"','id="admin-crop-chart"','id="admin-month-chart"','id="admin-workflow-pie"','id="admin-farm-chart"','id="admin-role-chart"','id="admin-analytics-recent"',
  'exportReports()','importAdminExcel(event)','window.print()','/api/reports/export.xlsx','/api/reports/import.xlsx',
  'id="admin-users-body"','createAdminUser(event)','loadAdminUsers()','saveAdminRole','deleteAdminUser','/api/admin/users','/role',
  'inter_farm_supervisor','head_of_department','Administrator'
];
const missing=required.filter(x=>!html.includes(x));
if(missing.length){console.error("Admin management verification failed:");missing.forEach(x=>console.error(`- ${x}`));process.exit(1);}
console.log("✓ Admin analytics, Excel, print and user-role UI verification passed.");
