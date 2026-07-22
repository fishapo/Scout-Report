const express = require("express");

const routes = require("./routes");

const { requestLogger } = require("./middleware/logger");
const securityHeaders = require("./middleware/securityHeaders");
const requireSiteAuth = require("./middleware/requireSiteAuth");
const errorHandler = require("./middleware/errorHandler");

function createApp() {

    const app = express();

    app.use(requestLogger);

    app.use(securityHeaders);

    app.use(express.json());

    app.use(express.urlencoded({ extended:true }));

    app.use(requireSiteAuth);

    app.use(routes);

    app.use(errorHandler);

    return app;
}

module.exports = { createApp };