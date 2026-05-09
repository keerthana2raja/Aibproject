/**
 * SQLite connection + schema + seed.
 *
 * Default is SQLite unless MongoDB is explicitly selected:
 *   • DB_PROVIDER=mongodb (or mongo) / DATABASE_PROVIDER → Mongo (+ MONGODB_URI required)
 *   • Anything else unset or sqlite → SQLite (MONGODB_URI is ignored)
 *
 * Optional: SQLITE_PATH (default ./data/aimplify.sqlite).
 */

const fs = require("fs");
const path = require("path");

const SQLITE_PATH_ENV = process.env.SQLITE_PATH || path.join(process.cwd(), "data", "aimplify.sqlite");
const { applyCanonicalDemoUpserts } = require("../data/sqliteSeedDemo");

let dbSingleton = null;

/** Id prefixes used for catalogue asset identifiers (SQLite / UI). */
const ASSET_FAMILY_PREFIX = {
  atlas: "ATL",
  forge: "FRG",
  relay: "RLY",
  sentinel: "SEN",
  nexus: "NXS",
};

function columnExists(database, table, column) {
  const rows = database.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((r) => r.name === column);
}

function migrateCatalogMasterSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS catalog_master_type (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS catalog_master_value (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      master_type_id INTEGER NOT NULL REFERENCES catalog_master_type(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      UNIQUE(master_type_id, code)
    );
    CREATE INDEX IF NOT EXISTS idx_master_value_type ON catalog_master_value(master_type_id);
  `);

  if (!columnExists(database, "assets", "maturity_master_id")) {
    database.exec(
      "ALTER TABLE assets ADD COLUMN maturity_master_id INTEGER REFERENCES catalog_master_value(id)",
    );
  }
  if (!columnExists(database, "assets", "effort_master_id")) {
    database.exec(
      "ALTER TABLE assets ADD COLUMN effort_master_id INTEGER REFERENCES catalog_master_value(id)",
    );
  }

  const insT = database.prepare(
    "INSERT OR IGNORE INTO catalog_master_type(code, label, sort_order) VALUES (?,?,?)",
  );
  [
    ["MATURITY", "Maturity", 10],
    ["CLOUD", "Cloud platform", 20],
    ["EFFORT", "Implementation effort", 30],
  ].forEach((row) => insT.run(...row));

  const typeId = (code) =>
    database.prepare("SELECT id FROM catalog_master_type WHERE code=?").get(code)?.id;

  const insV = database.prepare(
    "INSERT OR IGNORE INTO catalog_master_value(master_type_id, code, label, sort_order) VALUES (?,?,?,?)",
  );
  const VALS = [
    ["MATURITY", "battle-tested", "Battle-tested", 10],
    ["MATURITY", "validated", "Validated", 20],
    ["MATURITY", "experimental", "Experimental", 30],
    ["CLOUD", "aws", "AWS", 10],
    ["CLOUD", "gcp", "GCP", 20],
    ["CLOUD", "azure", "Azure", 30],
    ["EFFORT", "low", "Low", 10],
    ["EFFORT", "medium", "Medium", 20],
    ["EFFORT", "high", "High", 30],
  ];
  VALS.forEach(([tcode, code, label, ord]) => {
    const tid = typeId(tcode);
    if (tid) insV.run(tid, String(code).toLowerCase(), label, ord);
  });
}

function backfillAssetMasterIds(database) {
  database.exec(`
    UPDATE assets SET maturity_master_id = (
      SELECT v.id FROM catalog_master_value v
      INNER JOIN catalog_master_type mt ON v.master_type_id = mt.id
      WHERE mt.code = 'MATURITY' AND LOWER(v.code) = LOWER(TRIM(assets.maturity))
    )
    WHERE (maturity_master_id IS NULL) AND maturity IS NOT NULL AND TRIM(maturity) != '';
  `);
  database.exec(`
    UPDATE assets SET effort_master_id = (
      SELECT v.id FROM catalog_master_value v
      INNER JOIN catalog_master_type mt ON v.master_type_id = mt.id
      WHERE mt.code = 'EFFORT' AND LOWER(v.code) = LOWER(TRIM(assets.effort))
    )
    WHERE (effort_master_id IS NULL) AND effort IS NOT NULL AND TRIM(effort) != '';
  `);
}

function getDb() {
  if (!dbSingleton) throw new Error("SQLite not initialized — call initSqlite() first.");
  return dbSingleton;
}

function migrateSqliteAssetAndActivityExtras(database) {
  const addAsset = (col, defSql) => {
    if (!columnExists(database, "assets", col)) database.exec(`ALTER TABLE assets ADD COLUMN ${col} ${defSql}`);
  };
  addAsset("stats_demos", "INTEGER NOT NULL DEFAULT 0");
  addAsset("stats_projects", "INTEGER NOT NULL DEFAULT 0");
  addAsset("stats_rating", "INTEGER");
  addAsset("attachments", "TEXT NOT NULL DEFAULT '[]'");
  addAsset("related_asset_ids", "TEXT NOT NULL DEFAULT '[]'");
  addAsset("demo_video_relpath", "TEXT DEFAULT ''");
  // submission_status: pipeline state for assets inserted immediately on submission
  // null = normal catalogue asset; 'ai-review' | 'governance' | 'remediation' | 'approved' = submitted
  addAsset("submission_status", "TEXT DEFAULT NULL");
  addAsset("submission_id", "TEXT DEFAULT NULL");
  if (!columnExists(database, "activities", "is_demo_seed")) {
    database.exec("ALTER TABLE activities ADD COLUMN is_demo_seed INTEGER NOT NULL DEFAULT 0");
  }

  // Registration extended fields — safe migrations for existing databases
  const addReg = (col, defSql) => {
    if (!columnExists(database, "registrations", col))
      database.exec(`ALTER TABLE registrations ADD COLUMN ${col} ${defSql}`);
  };
  addReg("owner",           "TEXT DEFAULT ''");
  addReg("team",            "TEXT DEFAULT ''");
  addReg("coContributors",  "TEXT DEFAULT ''");
  addReg("version",         "TEXT DEFAULT ''");
  addReg("cloud",           "TEXT DEFAULT ''");
  addReg("maturity",        "TEXT DEFAULT 'experimental'");
  addReg("gitUrl",          "TEXT DEFAULT ''");
  addReg("architecture",    "TEXT DEFAULT ''");
  addReg("prerequisites",   "TEXT DEFAULT ''");
  addReg("tags",            "TEXT DEFAULT ''");
  addReg("demo_video_relpath", "TEXT DEFAULT ''");
  addReg("submission_attachments", "TEXT DEFAULT '[]'");
  addReg("promoted_asset_id", "TEXT DEFAULT ''");
  addReg("quickStart", "TEXT DEFAULT ''");
}

function runSchema(database) {
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      desc TEXT,
      family TEXT NOT NULL,
      clouds TEXT DEFAULT '[]',
      maturity TEXT,
      effort TEXT,
      demoReady INTEGER DEFAULT 0,
      solution TEXT,
      owner TEXT,
      ownerInitials TEXT,
      architecture TEXT,
      quickStart TEXT,
      prerequisites TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      changelog TEXT DEFAULT '[]',
      stats_deploys INTEGER DEFAULT 0,
      stats_stars INTEGER DEFAULT 0,
      stats_demos INTEGER NOT NULL DEFAULT 0,
      stats_projects INTEGER NOT NULL DEFAULT 0,
      stats_rating INTEGER,
      attachments TEXT DEFAULT '[]',
      related_asset_ids TEXT DEFAULT '[]',
      demo_video_relpath TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registrationId TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      family TEXT NOT NULL,
      description TEXT,
      submitedBy TEXT,
      date TEXT,
      status TEXT NOT NULL,
      aiScore INTEGER,
      aiFindings TEXT DEFAULT '[]',
      govReviewer TEXT,
      govNotes TEXT,
      statusHistory TEXT DEFAULT '[]',
      owner TEXT DEFAULT '',
      team TEXT DEFAULT '',
      coContributors TEXT DEFAULT '',
      version TEXT DEFAULT '',
      cloud TEXT DEFAULT '',
      maturity TEXT DEFAULT 'experimental',
      gitUrl TEXT DEFAULT '',
      architecture TEXT DEFAULT '',
      prerequisites TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      demo_video_relpath TEXT DEFAULT '',
      submission_attachments TEXT DEFAULT '[]',
      promoted_asset_id TEXT DEFAULT '',
      quickStart TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      action TEXT NOT NULL,
      resourceType TEXT DEFAULT 'other',
      description TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      is_demo_seed INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS families (
      key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT,
      long_desc TEXT,
      use_cases TEXT DEFAULT '[]',
      solutions TEXT DEFAULT '[]',
      depends_on TEXT DEFAULT '[]',
      enables TEXT DEFAULT '[]',
      stats_assets INTEGER DEFAULT 0,
      stats_deploys INTEGER DEFAULT 0,
      stats_battle_tested INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member'
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_assets_family ON assets(family);
    CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
    CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(createdAt DESC);
  `);
}

function seedUsersIfEmpty(database) {
  const nUsers = database.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  if (nUsers > 0) return;
  const ins = database.prepare("INSERT INTO users (email, name, role) VALUES (?,?,?)");
  [
    ["abhilash.v@infovision.com", "Abhilash Vantaram", "admin"],
    ["keerthana.r@infovision.com", "Keerthana R.", "editor"],
    ["operations.admin@infovision.com", "AIMPLIFY Ops", "admin"],
  ].forEach((row) => ins.run(row[0], row[1], row[2]));
  console.log("✅ SQLite seeded directory users.");
}

function initSqlite() {
  if (dbSingleton) return dbSingleton;

  const dir = path.dirname(SQLITE_PATH_ENV);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  try {
    const Database = require("better-sqlite3");
    dbSingleton = new Database(SQLITE_PATH_ENV);
  } catch (e) {
    if (e && (e.code === "ERR_DLOPEN_FAILED" || /different Node\.js version|NODE_MODULE_VERSION/i.test(String(e.message)))) {
      console.error(`
❌ better-sqlite3 native addon does not match this Node (${process.version}, module ${process.versions.modules}).

Fix (same Node must be used for install and for npm run dev):
  1. Stop nodemon / all node.exe using this repo (unlock better_sqlite3.node on Windows).
  2. In functions/:  npm run fresh-sqlite-addon
     …or manually:    npm rebuild better-sqlite3

Pin Node: backend targets Node 20 (functions/.nvmrc). Example: nvm use 20
`);
    }
    throw e;
  }
  dbSingleton.pragma("journal_mode = WAL");

  runSchema(dbSingleton);
  migrateCatalogMasterSchema(dbSingleton);
  migrateSqliteAssetAndActivityExtras(dbSingleton);
  applyCanonicalDemoUpserts(dbSingleton);
  backfillAssetMasterIds(dbSingleton);
  try {
    require("../services/sqliteService").recomputeAllFamilyStatsSqlite();
  } catch (e) {
    console.warn("Family stats reconcile skipped:", e.message);
  }
  seedUsersIfEmpty(dbSingleton);

  console.log(`✅ SQLite ready at ${SQLITE_PATH_ENV}`);
  return dbSingleton;
}

function isSqliteMode() {
  const raw = process.env.DB_PROVIDER || process.env.DATABASE_PROVIDER || "";
  const p = raw.toLowerCase().trim();
  if (p === "mongodb" || p === "mongo") return false;
  return true;
}

module.exports = {
  initSqlite,
  getDb,
  isSqliteMode,
  SQLITE_PATH_ENV,
  migrateCatalogMasterSchema,
  ASSET_FAMILY_PREFIX,
};
