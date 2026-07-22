const { createApp } = require("./app");
const getPort = require("get-port").default;

async function start() {
    const app = createApp();

    const preferredPort = Number(process.env.PORT || 8080);

    const port = await getPort({
        port: Array.from({ length: 100 }, (_, i) => preferredPort + i)
    });

    const server = app.listen(port, () => {
        console.log(`🚀 Scout Report API running on http://localhost:${port}`);

        if (port !== preferredPort) {
            console.log(`⚠️ Port ${preferredPort} was busy. Using ${port}.`);
        }
    });

    process.on("SIGINT", () => server.close(() => process.exit(0)));
    process.on("SIGTERM", () => server.close(() => process.exit(0)));
}

start().catch(console.error);
router.get("/", (req, res) => {
    res.json({
        application: "Scout Report API",
        version: "2.0.0",
        status: "running"
    });
});