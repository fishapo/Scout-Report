const path = require("path");
require("dotenv").config({
    path: path.resolve(process.cwd(), ".env")
});

const config = {
    NODE_ENV: process.env.NODE_ENV || "development",

    PORT: Number(process.env.PORT || 3000),

    HOST: process.env.HOST || "127.0.0.1",

    JWT_SECRET:
        process.env.JWT_SECRET ||
        "development-only-change-me",

    JWT_TTL_SECONDS:
        Number(process.env.JWT_TTL_SECONDS || 28800)
};

module.exports = config;