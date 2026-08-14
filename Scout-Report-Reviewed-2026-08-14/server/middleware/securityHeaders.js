module.exports = function securityHeaders(req, res, next) {

    const isProduction = process.env.NODE_ENV === "production";
    const forwardedProtocol = req.get("x-forwarded-proto");

    if (isProduction && forwardedProtocol && forwardedProtocol !== "https") {
        const host = req.get("host");
        return res.redirect(308, `https://${host}${req.originalUrl}`);
    }

    res.setHeader("X-Content-Type-Options", "nosniff");

    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    res.setHeader("Referrer-Policy", "no-referrer");

    if (isProduction) {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    next();

};
