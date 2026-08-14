"use strict";
const fs=require("fs"),path=require("path"),{execFileSync}=require("child_process");
const root=path.resolve(__dirname,".."),checks=[]; const check=(n,o,d="")=>checks.push({n,o:!!o,d});
const read=f=>fs.readFileSync(path.join(root,f),"utf8"), exists=f=>fs.existsSync(path.join(root,f));
const pkg=JSON.parse(read("package.json")), lock=JSON.parse(read("package-lock.json"));
check("package metadata consistent",pkg.name===lock.name&&pkg.version===lock.version);
check("npm pinned",pkg.packageManager==="npm@10.9.2"); check("lockfile v3",lock.lockfileVersion===3);
check("public npm registry declared",read(".npmrc").includes("registry=https://registry.npmjs.org/"));
for(const f of ["docs/RELEASE-RUNBOOK.md","scripts/verify-phase9.js","scripts/verify-phase8.js","docker-compose.yml","server/migrations/init.sql",".env.example","previews/admin-dashboard.html","previews/admin-reference.js"] ) check(`exists: ${f}`,exists(f));
check("public reference routes mounted",read("server/routes/index.js").includes('"/reference"'));
check("admin reference routes mounted",read("server/routes/index.js").includes('"/admin/reference"'));
check("production JWT protection",read("server/index.js").includes("JWT_SECRET must not use the development fallback in production"));
check("health endpoint present",read("server/routes/health.routes.js").includes("getHealth"));
check("security headers mounted",read("server/app.js").includes("app.use(securityHeaders)"));
check("auth rate limiter present",read("server/routes/auth.routes.js").includes("authenticationAttemptLimiter"));
check("clean install documented",read("README.md").includes("npm ci"));
const syntax=["server/index.js","server/app.js","server/config/env.js","server/db.js","server/auth.js","server/controllers/auth.controller.js","server/routes/auth.routes.js","server/routes/index.js","previews/admin-reference.js","scripts/verify-phase9.js","scripts/verify-phase10.js"];
for(const f of syntax){try{execFileSync(process.execPath,["--check",path.join(root,f)],{stdio:"ignore"});check(`syntax: ${f}`,true)}catch(e){check(`syntax: ${f}`,false)}}
const bad=checks.filter(x=>!x.o); console.log("Phase 10 Final Release Candidate Verification"); for(const x of checks) console.log(`${x.o?"PASS":"FAIL"} | ${x.n}${x.d?` | ${x.d}`:""}`); console.log(`Checks: ${checks.length}`); console.log(`Passed: ${checks.length-bad.length}`); console.log(`Failed: ${bad.length}`); process.exitCode=bad.length?1:0;
