const { initSqlite } = require("./sqlite");

/**
 * Connects to Turso DB (via @libsql/client).
 * Requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env vars.
 */
const connectDB = async () => {
  await initSqlite();
  return { provider: "turso" };
};

module.exports = connectDB;
