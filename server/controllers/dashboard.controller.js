"use strict";
const dashboard = require("../dashboard");
async function getSnapshot(req, res, next) {
  try {
    const batch = req.query.batch;
    if (batch !== undefined && (typeof batch !== "string" || !batch.trim() || batch.length > 50)) {
      return res.status(400).json({ success: false, error: "Invalid workbook batch" });
    }
    const result = await dashboard.snapshot(req.user, batch ?? null);
    res.json({ success: true, dashboard: result });
  } catch (error) { next(error); }
}
module.exports={getSnapshot};
