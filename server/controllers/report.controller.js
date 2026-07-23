async function list(req, res, next) {
    try {
        res.json({
            message: "List reports",
            data: []
        });
    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    try {
        res.status(201).json({
            message: "Create report"
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    list,
    create
};
