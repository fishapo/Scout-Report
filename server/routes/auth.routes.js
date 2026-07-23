const express = require("express");

const controller = require("../controllers/auth.controller");
const auth = require("../auth");

const router = express.Router();

// Public routes
router.post("/register", controller.register);
router.post("/login", controller.login);

// Protected routes
router.get("/me", auth.authenticate, controller.me);

router.post("/logout", auth.authenticate, controller.logout);

module.exports = router;