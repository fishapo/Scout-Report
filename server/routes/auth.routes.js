const express = require("express");

const controller = require("../controllers/auth.controller");
const auth = require("../auth");

const router = express.Router();

router.post("/login", controller.login);

router.post("/register", controller.register);

router.post(
    "/logout",
    auth.authenticate,
    controller.logout
);

router.get(
    "/me",
    auth.authenticate,
    controller.me
);

module.exports = router;