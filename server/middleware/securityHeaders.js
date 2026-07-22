module.exports = function securityHeaders(req, res, next) {

    res.setHeader("X-Content-Type-Options", "nosniff");

    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    res.setHeader("Referrer-Policy", "no-referrer");

    next();

};