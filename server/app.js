const express = require("express");

const routes = require("./routes");
const path = require("path");

const { requestLogger } = require("./middleware/logger");
const securityHeaders = require("./middleware/securityHeaders");
const requireSiteAuth = require("./middleware/requireSiteAuth");
const errorHandler = require("./middleware/errorHandler");

function createApp() {
    const app = express();

   app.use(securityHeaders);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../previews")));

app.use(requestLogger);

app.use(requireSiteAuth);

app.use(routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
        requestId: req.requestId
    });
});

// Error handler
app.use(errorHandler);
    return app;
}

module.exports = { createApp };