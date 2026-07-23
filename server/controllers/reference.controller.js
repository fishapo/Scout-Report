async function list(req, res, next) {
    try {
        res.json({
            message: "Reference data"
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    list
};