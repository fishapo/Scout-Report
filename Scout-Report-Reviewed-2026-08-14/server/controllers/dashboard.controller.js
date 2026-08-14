"use strict";
const dashboard = require("../dashboard");
async function getSnapshot(req,res,next){try{res.json({success:true,dashboard:await dashboard.snapshot(req.user)});}catch(e){next(e);}}
module.exports={getSnapshot};
