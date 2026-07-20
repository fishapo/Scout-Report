const { createApp } = require("./app");

const app = createApp();
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "127.0.0.1";

process.on("uncaughtException", (err) => console.error("uncaughtException", err));
process.on("unhandledRejection", (err) => console.error("unhandledRejection", err));

app.listen(port, host, () => {
  console.log(`Scout Report server running on http://${host}:${port}`);
});