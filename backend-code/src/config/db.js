const mongoose = require("mongoose");
const { initSqlite, isSqliteMode } = require("./sqlite");

let mongoConnected = false;

/**
 * DB selection (see src/config/sqlite.js isSqliteMode):
 *   • Default: SQLite (Mongo is opt-in via DB_PROVIDER=mongodb + MONGODB_URI).
 */
const connectDB = async () => {
  if (isSqliteMode()) {
    initSqlite();
    return { provider: "sqlite" };
  }

  try {
    if (!process.env.MONGODB_URI || !String(process.env.MONGODB_URI).trim()) {
      console.error("❌ MONGODB_URI is required when using MongoDB (set DB_PROVIDER=mongodb or use production with a URI).");
      process.exit(1);
    }
    if (mongoConnected) return { provider: "mongodb" };

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    mongoConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return { provider: "mongodb" };
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(
      "   → For local SQLite, set DB_PROVIDER=sqlite in functions/.env — no Atlas whitelist or VPN required.",
    );
    process.exit(1);
  }
};

module.exports = connectDB;
