const express = require("express");
const controller = require("../controllers/report.controller");

const router = express.Router();

router.get("/reports", controller.list);

router.post("/reports", controller.create);

module.exports = router;