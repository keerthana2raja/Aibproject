require("dotenv").config();
const connectDB = require("./config/db");

const PORT = Number(process.env.PORT) || 5000;

let appReady = null;

const getApp = async () => {
  if (!appReady) {
    await connectDB();
    appReady = require("./app");
  }
  return appReady;
};

// Vercel serverless export
module.exports = async (req, res) => {
  const app = await getApp();
  return app(req, res);
};

if (require.main === module) {
  getApp()
    .then((app) => {
      app.listen(PORT, () => {
        console.log(`🚀 AIMPLIFY API running at http://localhost:${PORT}/v1`);
        console.log(`📋 Health: http://localhost:${PORT}/v1/health`);
        console.log(
          `   DB: ${require("./config/sqlite").isSqliteMode() ? "SQLite" : "MongoDB"}`,
        );
      });
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
