const express = require("express");
const controller = require("../controllers/reference.controller");

const router = express.Router();

router.get("/reference", controller.list);

module.exports = router;