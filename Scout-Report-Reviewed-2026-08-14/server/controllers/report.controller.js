/**
 * ==========================================================
 * Scout Report API
 * ==========================================================
 *
 * Report Controller
 *
 * Responsibilities
 * ----------------
 * • Handle HTTP requests for /scout-reports
 * • Call server/store.js (the PostgreSQL-backed store)
 * • Return response shapes that match previews/admin-
 *   dashboard.html and previews/user-form.html, which expect
 *   raw arrays/objects, not an { success, data } envelope.
 *
 * NOTE: this replaces the previous version of this file,
 * which called server/models/report.model.js. That model was
 * an in-memory array (see its own file header: "Phase 1 -
 * Temporary in-memory data store, no database required") and
 * did not persist data, support filtering/pagination, or
 * expose stats, despite being added in a commit titled
 * "complete Phase 3 PostgreSQL reference architecture".
 * server/store.js is the complete, tested implementation
 * (see server/store.test.js, server/store.crud.test.js) and
 * is now the single source of truth for report data.
 * models/report.model.js has been removed.
 *
 * Auth / RBAC is enforced in the route definitions
 * (server/routes/report.routes.js) using auth.authenticate
 * and auth.authorizeRoles, per the table in README.md.
 *
 * Endpoints
 * ---------
 * GET    /scout-reports
 * GET    /scout-reports/stats
 * GET    /scout-reports/:id
 * POST   /scout-reports
 * PATCH  /scout-reports/:id
 * POST   /scout-reports/:id/pest-observations
 * POST   /scout-reports/:id/disease-observations
 * DELETE /scout-reports/:id
 *
 * ==========================================================
 */

"use strict";

const store = require("../store");

const { createWorkbook, readWorkbook } = require("../xlsx-lite");
const { canonicalHeaders, canonicalRow, canonicalRecordFromRow, canonicalFromReport } = require("../canonical-report");
const { normalizeHeader } = require("../import/normalize");
const { stageWorkbook, commitBatch } = require("../import/master-import.service");

const MASTER_HEADERS = [
    'WEEK','Farm','GH','Inpl. wk-year','Crop','Variety',
    'Thrips_Larvae','Thrips_adults','LEAF MINER_feeding point','LEAF MINER_complete mines',
    'White fly_eggs','White fly_adult','Aphids_nymphs','Aphids_adult','Spider mite_eggs','Spider mite_adults',
    'Beetles_countimg','Cater pillar_spots','Butter-flies_counting','Sciara fly_spots','Cut worms_counting',
    'Mealy bugs_spots','Slugs_counting','Snails_counting','Nema- todes_spots','Chlo- rosis_spots/MP',
    'Fusarium_MP','Rhyzoc tonia_MP','Powdery mildew_MP','Botrytis_spots/MP','Leafspot_Black','Leafspot_Brown',
    'Flower buds_Cuttings','Chem. Damage_MP','Virus doubt_MP','Mix_MP','Dry spots_Bags/spots','Others'
];

function exportRows(reports) {
    const keys = [
        'week','farm','gh','inplanting_week_year','crop','variety','thrips_larvae','thrips_adults',
        'leaf_miner_feeding_point','leaf_miner_complete_mines','white_fly_eggs','white_fly_adult','aphids_nymphs','aphids_adult',
        'spider_mite_eggs','spider_mite_adults','beetles_counting','caterpillar_spots','butterflies_counting','sciara_fly_spots',
        'cut_worms_counting','mealy_bugs_spots','slugs_counting','snails_counting','nematodes_spots','chlorosis_spots_mp',
        'fusarium_mp','rhizoctonia_mp','powdery_mildew_mp','botrytis_spots_mp','leafspot_black','leafspot_brown',
        'flower_buds_cuttings','chemical_damage_mp','virus_doubt_mp','mix_mp','dry_spots_bags_spots','others'
    ];
    return reports.map(r => {
        const m = r.masterObservations || {};
        return keys.map((key, i) => {
            if (m[key] !== undefined && m[key] !== null) return m[key];
            if (key === 'farm') return r.farmName || '';
            if (key === 'gh') return r.isGreenhouse ? 'GREENHOUSE' : 'Field';
            if (key === 'crop') return r.cropType || '';
            if (key === 'variety') return r.variety || '';
            if (key === 'week') return r.implementationWeek || '';
            if (key === 'inplanting_week_year') return r.implementationWeek && r.implementationYear ? `${r.implementationWeek}/${String(r.implementationYear).slice(-2)}` : '';
            return '';
        });
    });
}

async function exportExcel(req, res, next) {
    try {
        const reports = await store.getReports({ ...req.query, limit: 500 }, req.user);
        const workbook = createWorkbook([MASTER_HEADERS, ...exportRows(reports)], "Clean Data");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="scout-reports-${new Date().toISOString().slice(0,10)}.xlsx"`);
        return res.send(workbook);
    } catch (error) { next(error); }
}

async function exportCanonicalExcel(req, res, next) {
    try {
        const reports = await store.getReports({ ...req.query, limit: 500 }, req.user);
        const rows = reports.map((report) => canonicalRow(report.canonicalPayload || canonicalFromReport(report)));
        const workbook = createWorkbook([canonicalHeaders(), ...rows], "Canonical Reports");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="scout-reports-canonical-${new Date().toISOString().slice(0,10)}.xlsx"`);
        return res.send(workbook);
    } catch (error) { next(error); }
}

async function importCanonicalExcel(req, res, next) {
    try {
        const base64 = typeof req.body?.workbookBase64 === "string" ? req.body.workbookBase64 : "";
        if (!base64) return res.status(400).json({ success:false, error:"workbookBase64 is required" });
        const buffer = Buffer.from(base64.replace(/^data:.*?;base64,/, ""), "base64");
        const rows = readWorkbook(buffer);
        const headers = (rows.shift() || []).map(v => String(v || "").trim());
        const expected = canonicalHeaders();
        const missing = expected.filter(h => !headers.includes(h));
        if (missing.length) return res.status(400).json({ success:false, error:`Missing canonical fields: ${missing.join(", ")}` });
        const imported=[]; const errors=[];
        for (let i=0;i<rows.length;i++) {
            if (!rows[i]?.some(v=>String(v??"").trim())) continue;
            const record = canonicalRecordFromRow(headers, rows[i]);
            try {
                if (!record.farmId || !record.farmName || !record.cropType || !record.reportDate) throw new Error("farmId, farmName, cropType and reportDate are required");
                const report = await store.saveReport({ ...record, canonicalPayload: record, masterObservations: {} }, req.user);
                imported.push(report.id);
            } catch (error) { errors.push({ row:i+2, error:error.message }); }
        }
        res.status(errors.length && !imported.length ? 400 : 200).json({ success:true, imported:imported.length, ids:imported, errors, canonicalFieldCount: expected.length });
    } catch (error) { next(error); }
}

async function importExcel(req, res, next) {
    try {
        const base64 = typeof req.body?.workbookBase64 === "string" ? req.body.workbookBase64 : "";
        if (!base64) return res.status(400).json({ success:false, error:"workbookBase64 is required" });
        const buffer = Buffer.from(base64.replace(/^data:.*?;base64,/, ""), "base64");
        if (!buffer.length) return res.status(400).json({ success:false, error:"Empty workbook" });

        const rows = readWorkbook(buffer);
        const rawHeaders = (rows[0] || []).map(v => String(v ?? "").trim());
        const normalizedHeaders = new Set(rawHeaders.map(normalizeHeader));
        const masterHeaders = new Set(MASTER_HEADERS.map(normalizeHeader));
        const isMasterWorkbook = MASTER_HEADERS.every(h => normalizedHeaders.has(normalizeHeader(h))) ||
            (normalizedHeaders.has("farm") && normalizedHeaders.has("crop") && normalizedHeaders.has("variety") && normalizedHeaders.has("gh"));

        // The Combined Scout Report Master workbook intentionally does not contain
        // farmId/reportDate columns. Route it through the validated master importer
        // instead of incorrectly applying the canonical four-field contract.
        if (isMasterWorkbook) {
            const sourceName = String(req.body?.sourceName || "Combined Scout Report Master.xlsx");
            const staged = await stageWorkbook(buffer, sourceName, req.user);
            const committed = await commitBatch(staged.batchId, req.user);
            return res.status(committed.committedRows > 0 || committed.totalValidated === 0 ? 200 : 400).json({
                success: committed.committedRows > 0 || committed.totalValidated === 0,
                importMode: "master",
                batchId: staged.batchId,
                totalRows: staged.totalRows,
                validatedRows: staged.acceptedRows,
                rejectedRows: staged.rejectedRows,
                imported: committed.committedRows,
                committedRows: committed.committedRows,
                totalValidated: committed.totalValidated,
                errors: committed.results.filter(r => r.status !== "committed"),
                message: `Master workbook processed: ${committed.committedRows} report(s) imported.`
            });
        }

        // Canonical exports are accepted with case/spacing variations in headings.
        const canonicalAlias = new Map(canonicalHeaders().map(h => [normalizeHeader(h), h]));
        const headers = rawHeaders.map(h => canonicalAlias.get(normalizeHeader(h)) || h);
        const expected = canonicalHeaders();
        const missing = expected.filter(h => !headers.includes(h));
        if (missing.length) {
            return res.status(400).json({
                success:false,
                error:`Unsupported workbook. Expected either the 38-column Combined Scout Report Master workbook or the ${expected.length}-field canonical export. Missing canonical columns: ${missing.join(", ")}`,
                importModes:["master","canonical"]
            });
        }

        const dataRows = rows.slice(1);
        const imported=[]; const errors=[];
        for (let i=0;i<dataRows.length;i++) {
            const row=dataRows[i]; if (!row?.some(v=>String(v??"").trim())) continue;
            const record = canonicalRecordFromRow(headers, row);
            try {
                // Canonical files require the identity fields. Master files use a
                // separate mapping path above because those fields are not present.
                if (!record.farmId || !record.farmName || !record.cropType) throw new Error("farmId, farmName and cropType are required");
                if (!record.reportDate) record.reportDate = new Date().toISOString().slice(0, 10);
                const report = await store.saveReport({ ...record, canonicalPayload: record, masterObservations: {} }, req.user);
                imported.push(report.id);
            } catch (error) { errors.push({ row:i+2, error:error.message }); }
        }
        res.status(errors.length && !imported.length ? 400 : 200).json({ success:true, importMode:"canonical", imported:imported.length, ids:imported, errors, canonicalFieldCount: expected.length });
    } catch (error) { next(error); }
}


/**
 * ----------------------------------------------------------
 * GET /scout-reports
 * ----------------------------------------------------------
 * Supports query params: farm, status, dateFrom, dateTo,
 * limit, offset (all optional; see store.buildReportFilters
 * and store.normalizePagination).
 * ----------------------------------------------------------
 */
async function getReports(req, res, next) {
    try {
        const reports = await store.getReports(req.query, req.user);
        res.json(reports);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * GET /scout-reports/stats
 * ----------------------------------------------------------
 * Returns: { totalReports, criticalIssues, activeFarms,
 *            responseRate }
 * Accepts the same filters as GET /scout-reports so the
 * admin dashboard can scope stats to the current filter set.
 * ----------------------------------------------------------
 */
async function getStats(req, res, next) {
    try {
        const stats = await store.getStats(req.query, req.user);
        res.json(stats);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * GET /scout-reports/:id
 * ----------------------------------------------------------
 */
async function getReport(req, res, next) {
    try {
        const report = await store.findReport(req.params.id, null, req.user);

        if (!report) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.json(report);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * POST /scout-reports
 * ----------------------------------------------------------
 */
async function createReport(req, res, next) {
    try {
        const report = await store.saveReport(req.body, req.user);
        res.status(201).json(report);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * PATCH /scout-reports/:id
 * ----------------------------------------------------------
 * store.updateReport only touches fields present on the
 * updates object (weather, temperature, humidity, notes,
 * status), which is PATCH (partial update) semantics.
 * ----------------------------------------------------------
 */
async function updateReport(req, res, next) {
    try {
        const report = await store.updateReport(req.params.id, req.body, req.user);

        if (!report) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.json(report);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * DELETE /scout-reports/:id
 * ----------------------------------------------------------
 */
async function deleteReport(req, res, next) {
    try {
        const deleted = await store.deleteReport(req.params.id, req.user);

        if (!deleted) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.status(204).end();
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * POST /scout-reports/:id/pest-observations
 * ----------------------------------------------------------
 */
async function addPestObservation(req, res, next) {
    try {
        const report = await store.addPestObservation(req.params.id, req.body, req.user);

        if (!report) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.status(201).json(report);
    }
    catch (error) {
        next(error);
    }
}

/**
 * ----------------------------------------------------------
 * POST /scout-reports/:id/disease-observations
 * ----------------------------------------------------------
 */
async function addDiseaseObservation(req, res, next) {
    try {
        const report = await store.addDiseaseObservation(req.params.id, req.body, req.user);

        if (!report) {
            return res.status(404).json({
                error: "Report not found"
            });
        }

        res.status(201).json(report);
    }
    catch (error) {
        next(error);
    }
}

module.exports = {
    exportCanonicalExcel,
    importCanonicalExcel,
    MASTER_HEADERS,
    getReports,
    getStats,
    getReport,
    createReport,
    updateReport,
    deleteReport,
    addPestObservation,
    addDiseaseObservation,
    exportExcel,
    importExcel
};
