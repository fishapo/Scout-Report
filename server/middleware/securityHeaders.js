module.exports = function securityHeaders(req, res, next) {

    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction && !req.secure) {
        const host = req.get("host");
        return res.redirect(308, `https://${host}${req.originalUrl}`);
    }

    res.setHeader("X-Content-Type-Options", "nosniff");

    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
    res.setHeader("Content-Security-Policy", "default-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'");

    if (isProduction) {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    next();

};
