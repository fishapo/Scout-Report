"use strict";

const store = require("../../store");

function success(res, data, status = 200) {
    return res.status(status).json({ success: true, data });
}

async function listFarms(_req, res, next) {
    try {
        return success(res, await store.getFarms());
    } catch (error) {
        return next(error);
    }
}

async function getFarm(req, res, next) {
    try {
        const farm = await store.findFarm(req.params.id);
        if (!farm) return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Farm not found" } });
        return success(res, farm);
    } catch (error) {
        return next(error);
    }
}

async function createFarm(req, res, next) {
    try {
        return success(res, await store.createFarm(req.body), 201);
    } catch (error) {
        return next(error);
    }
}

async function updateFarm(req, res, next) {
    try {
        const farm = await store.updateFarm(req.params.id, req.body);
        if (!farm) return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Farm not found" } });
        return success(res, farm);
    } catch (error) {
        return next(error);
    }
}

async function deleteFarm(req, res, next) {
    try {
        const result = await store.deleteFarm(req.params.id);
        if (result.reason === "not_found") {
            return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Farm not found" } });
        }
        if (result.reason === "in_use") {
            return res.status(409).json({
                success: false,
                error: {
                    code: "REFERENCE_IN_USE",
                    message: "This farm is used by existing scout reports and cannot be deleted.",
                    dependencyCount: result.dependencyCount,
                },
            });
        }
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
}

async function listCropTypes(_req, res, next) {
    try { return success(res, await store.getCropTypesAdmin()); } catch (error) { return next(error); }
}

async function getCropType(req, res, next) {
    try {
        const cropType = await store.findCropType(req.params.id);
        if (!cropType) return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Crop type not found" } });
        return success(res, cropType);
    } catch (error) { return next(error); }
}

async function createCropType(req, res, next) {
    try { return success(res, await store.createCropType(req.body), 201); } catch (error) { return next(error); }
}

async function updateCropType(req, res, next) {
    try {
        const cropType = await store.updateCropType(req.params.id, req.body);
        if (!cropType) return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Crop type not found" } });
        return success(res, cropType);
    } catch (error) { return next(error); }
}

async function deleteCropType(req, res, next) {
    try {
        const result = await store.deleteCropType(req.params.id);
        if (result.reason === "not_found") return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Crop type not found" } });
        if (result.reason === "in_use") return res.status(409).json({
            success: false,
            error: { code: "REFERENCE_IN_USE", message: "This crop type has varieties and cannot be deleted.", dependencyCount: result.dependencyCount }
        });
        return res.status(204).end();
    } catch (error) { return next(error); }
}

async function listCropVarieties(req, res, next) {
    try {
        const varieties = await store.getCropVarietiesAdmin(req.params.cropTypeId);
        if (varieties === null) return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Crop type not found" } });
        return success(res, varieties);
    } catch (error) { return next(error); }
}

async function getCropVariety(req, res, next) {
    try {
        const parent = await store.findCropType(req.params.cropTypeId);
        if (!parent) return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Crop type not found" } });
        const variety = await store.findCropVariety(req.params.cropTypeId, req.params.id);
        if (!variety) return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Crop variety not found" } });
        return success(res, variety);
    } catch (error) { return next(error); }
}

async function createCropVariety(req, res, next) {
    try { return success(res, await store.createCropVariety(req.params.cropTypeId, req.body), 201); }
    catch (error) { return next(error); }
}

async function updateCropVariety(req, res, next) {
    try {
        const variety = await store.updateCropVariety(req.params.cropTypeId, req.params.id, req.body);
        if (!variety) return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Crop variety not found" } });
        return success(res, variety);
    } catch (error) { return next(error); }
}

async function deleteCropVariety(req, res, next) {
    try {
        const result = await store.deleteCropVariety(req.params.cropTypeId, req.params.id);
        if (result.reason === "parent_not_found") return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Crop type not found" } });
        if (result.reason === "not_found") return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Crop variety not found" } });
        return res.status(204).end();
    } catch (error) { return next(error); }
}


async function listDiseases(_req, res, next) {
    try { return success(res, await store.getDiseasesAdmin()); } catch (error) { return next(error); }
}

async function getDisease(req, res, next) {
    try {
        const disease = await store.findDisease(req.params.id);
        if (!disease) return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Disease not found" } });
        return success(res, disease);
    } catch (error) { return next(error); }
}

async function createDisease(req, res, next) {
    try { return success(res, await store.createDisease(req.body), 201); } catch (error) { return next(error); }
}

async function updateDisease(req, res, next) {
    try {
        const disease = await store.updateDisease(req.params.id, req.body);
        if (!disease) return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Disease not found" } });
        return success(res, disease);
    } catch (error) { return next(error); }
}

async function deleteDisease(req, res, next) {
    try {
        const result = await store.deleteDisease(req.params.id);
        if (result.reason === "not_found") return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Disease not found" } });
        return res.status(204).end();
    } catch (error) { return next(error); }
}

async function listPests(_req, res, next) {
    try { return success(res, await store.getPestsAdmin()); } catch (error) { return next(error); }
}

async function getPest(req, res, next) {
    try {
        const pest = await store.findPest(req.params.id);
        if (!pest) return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Pest not found" } });
        return success(res, pest);
    } catch (error) { return next(error); }
}

async function createPest(req, res, next) {
    try { return success(res, await store.createPest(req.body), 201); } catch (error) { return next(error); }
}

async function updatePest(req, res, next) {
    try {
        const pest = await store.updatePest(req.params.id, req.body);
        if (!pest) return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Pest not found" } });
        return success(res, pest);
    } catch (error) { return next(error); }
}

async function deletePest(req, res, next) {
    try {
        const result = await store.deletePest(req.params.id);
        if (result.reason === "not_found") return res.status(404).json({ success: false, error: { code: "REFERENCE_NOT_FOUND", message: "Pest not found" } });
        return res.status(204).end();
    } catch (error) { return next(error); }
}

module.exports = { listFarms, getFarm, createFarm, updateFarm, deleteFarm, listCropTypes, getCropType, createCropType, updateCropType, deleteCropType, listCropVarieties, getCropVariety, createCropVariety, updateCropVariety, deleteCropVariety, listPests, getPest, createPest, updatePest, deletePest, listDiseases, getDisease, createDisease, updateDisease, deleteDisease };
