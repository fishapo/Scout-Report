const express = require("express");
const router = express.Router();

const controller = require("../controllers/report.controller");

// List reports
router.get("/reports", controller.list);

// Get one report
router.get("/reports/:id", controller.get);

// Create report
router.post("/reports", controller.create);

// Update report
router.put("/reports/:id", controller.update);

// Delete report
router.delete("/reports/:id", controller.remove);

module.exports = router;