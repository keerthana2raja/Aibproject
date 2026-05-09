require("dotenv").config();
const connectDB = require("./config/db");

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  await connectDB();
  const app = require("./app");
  app.listen(PORT, () => {
    console.log(`🚀 AIMPLIFY API running at http://localhost:${PORT}/v1`);
    console.log(`📋 Health: http://localhost:${PORT}/v1/health`);
    console.log(`   DB: ${require("./config/sqlite").isSqliteMode() ? "SQLite" : "MongoDB"}`);
  });
};

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
