const express = require("express");
const { getHealth } = require("../db");

const router = express.Router();

router.get("/", async (_req, res) => {
    const health = await getHealth();
    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json({
        status: health.status === "healthy" ? "ok" : "degraded",
        database: health.database
    });
});

module.exports = router;
