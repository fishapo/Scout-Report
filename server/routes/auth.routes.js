const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        module: "auth",
        status: "ready"
    });
});

module.exports = router;