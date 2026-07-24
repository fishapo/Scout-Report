const { logError } = require("./logger");

module.exports = function errorHandler(err, req, res, next) {

    logError(
        "Unhandled request error",
        err,
        {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            userId: req.user?.id
        }
    );

    res.status(err.statusCode || 500).json({
        error: err.message || "Internal Server Error",
        requestId: req.requestId
    });
};