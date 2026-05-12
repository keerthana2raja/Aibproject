require("dotenv").config();
const connectDB = require("./config/db");

const PORT = Number(process.env.PORT) || 5000;

// B1 FIX: connectDB() is called at module-level so it runs ONCE per container
// lifetime, not inside the request handler where it would reconnect on every
// cold start.
const dbReady = connectDB();
const app = require("./app");

// Vercel serverless export
module.exports = async (req, res) => {
  await dbReady; // resolves instantly after the first cold-start
  return app(req, res);
};

if (require.main === module) {
  dbReady
    .then(() => {
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
