"use strict";

const express = require("express");
const auth = require("../../auth");
const controller = require("../../controllers/admin/reference.controller");

const router = express.Router();
const adminOnly = [auth.authenticate, auth.authorizeRoles("admin")];

router.get("/farms", ...adminOnly, controller.listFarms);
router.post("/farms", ...adminOnly, controller.createFarm);
router.get("/farms/:id", ...adminOnly, controller.getFarm);
router.patch("/farms/:id", ...adminOnly, controller.updateFarm);
router.delete("/farms/:id", ...adminOnly, controller.deleteFarm);


router.get("/diseases", ...adminOnly, controller.listDiseases);
router.post("/diseases", ...adminOnly, controller.createDisease);
router.get("/diseases/:id", ...adminOnly, controller.getDisease);
router.patch("/diseases/:id", ...adminOnly, controller.updateDisease);
router.delete("/diseases/:id", ...adminOnly, controller.deleteDisease);

router.get("/pests", ...adminOnly, controller.listPests);
router.post("/pests", ...adminOnly, controller.createPest);
router.get("/pests/:id", ...adminOnly, controller.getPest);
router.patch("/pests/:id", ...adminOnly, controller.updatePest);
router.delete("/pests/:id", ...adminOnly, controller.deletePest);

router.get("/crop-types", ...adminOnly, controller.listCropTypes);
router.post("/crop-types", ...adminOnly, controller.createCropType);
router.get("/crop-types/:id", ...adminOnly, controller.getCropType);
router.patch("/crop-types/:id", ...adminOnly, controller.updateCropType);
router.delete("/crop-types/:id", ...adminOnly, controller.deleteCropType);

router.get("/crop-types/:cropTypeId/varieties", ...adminOnly, controller.listCropVarieties);
router.post("/crop-types/:cropTypeId/varieties", ...adminOnly, controller.createCropVariety);
router.get("/crop-types/:cropTypeId/varieties/:id", ...adminOnly, controller.getCropVariety);
router.patch("/crop-types/:cropTypeId/varieties/:id", ...adminOnly, controller.updateCropVariety);
router.delete("/crop-types/:cropTypeId/varieties/:id", ...adminOnly, controller.deleteCropVariety);

module.exports = router;
