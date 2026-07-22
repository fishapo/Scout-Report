const express = require("express");

const authRoutes = require("./auth.routes");
const reportRoutes = require("./report.routes");
const referenceRoutes = require("./reference.routes");
const healthRoutes = require("./health.routes");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        application: "Scout Report API",
        version: "2.0.0",
        status: "running"
    });
});

router.use("/auth", authRoutes);
router.use("/api/health", healthRoutes);
router.use("/api", referenceRoutes);
router.use("/api", reportRoutes);

module.exports = router;