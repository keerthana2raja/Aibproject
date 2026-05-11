/**
 * Database config — uses Turso (@libsql/client) in production, local SQLite file in dev.
 * Turso env vars: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
 * Local fallback: file:data/aimplify.sqlite (or /tmp on Vercel)
 */
const path = require("path");
const { createClient } = require("@libsql/client");

const LOCAL_PATH = process.env.SQLITE_PATH ||
  (process.env.VERCEL
    ? "file:/tmp/aimplify.sqlite"
    : `file:${path.join(process.cwd(), "data", "aimplify.sqlite")}`);

const ASSET_FAMILY_PREFIX = { atlas:"ATL", forge:"FRG", relay:"RLY", sentinel:"SEN", nexus:"NXS" };

let _client = null;
let _initialized = false;

function getDb() {
  if (!_client) {
    _client = (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN)
      ? createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN, intMode: "number" })
      : createClient({ url: LOCAL_PATH, intMode: "number" });
  }
  return _client;
}

async function columnExists(db, table, col) {
  const r = await db.execute(`PRAGMA table_info(${table})`);
  return r.rows.some((row) => row.name === col);
}

async function runSchema(db) {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, name TEXT NOT NULL, desc TEXT, family TEXT NOT NULL, clouds TEXT DEFAULT '[]', maturity TEXT, effort TEXT, demoReady INTEGER DEFAULT 0, solution TEXT, owner TEXT, ownerInitials TEXT, architecture TEXT, quickStart TEXT, prerequisites TEXT DEFAULT '[]', tags TEXT DEFAULT '[]', changelog TEXT DEFAULT '[]', stats_deploys INTEGER DEFAULT 0, stats_stars INTEGER DEFAULT 0, stats_demos INTEGER NOT NULL DEFAULT 0, stats_projects INTEGER NOT NULL DEFAULT 0, stats_rating INTEGER, attachments TEXT DEFAULT '[]', related_asset_ids TEXT DEFAULT '[]', demo_video_relpath TEXT DEFAULT '', submission_status TEXT DEFAULT NULL, submission_id TEXT DEFAULT NULL)`,
    `CREATE TABLE IF NOT EXISTS registrations (id INTEGER PRIMARY KEY AUTOINCREMENT, registrationId TEXT UNIQUE NOT NULL, name TEXT NOT NULL, family TEXT NOT NULL, description TEXT, submitedBy TEXT, date TEXT, status TEXT NOT NULL, aiScore INTEGER, aiFindings TEXT DEFAULT '[]', govReviewer TEXT, govNotes TEXT, statusHistory TEXT DEFAULT '[]', owner TEXT DEFAULT '', team TEXT DEFAULT '', coContributors TEXT DEFAULT '', version TEXT DEFAULT '', cloud TEXT DEFAULT '', maturity TEXT DEFAULT 'experimental', gitUrl TEXT DEFAULT '', architecture TEXT DEFAULT '', prerequisites TEXT DEFAULT '', tags TEXT DEFAULT '', demo_video_relpath TEXT DEFAULT '', submission_attachments TEXT DEFAULT '[]', promoted_asset_id TEXT DEFAULT '', quickStart TEXT DEFAULT '')`,
    `CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, name TEXT NOT NULL, email TEXT DEFAULT '', action TEXT NOT NULL, resourceType TEXT DEFAULT 'other', description TEXT, createdAt TEXT DEFAULT (datetime('now')), is_demo_seed INTEGER NOT NULL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS families (key TEXT PRIMARY KEY, name TEXT NOT NULL, tagline TEXT, long_desc TEXT, use_cases TEXT DEFAULT '[]', solutions TEXT DEFAULT '[]', depends_on TEXT DEFAULT '[]', enables TEXT DEFAULT '[]', stats_assets INTEGER DEFAULT 0, stats_deploys INTEGER DEFAULT 0, stats_battle_tested INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member')`,
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_assets_family ON assets(family)`,
    `CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status)`,
    `CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(createdAt)`,
  ];
  for (const sql of stmts) {
    try { await db.execute(sql); } catch(e) { /* ignore if exists */ }
  }
}

async function migrateCatalogMasterSchema(db) {
  const schemaSql = [
    `CREATE TABLE IF NOT EXISTS catalog_master_type (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, label TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS catalog_master_value (id INTEGER PRIMARY KEY AUTOINCREMENT, master_type_id INTEGER NOT NULL REFERENCES catalog_master_type(id) ON DELETE CASCADE, code TEXT NOT NULL, label TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, UNIQUE(master_type_id, code))`,
    `CREATE INDEX IF NOT EXISTS idx_master_value_type ON catalog_master_value(master_type_id)`,
  ];
  for (const sql of schemaSql) { try { await db.execute(sql); } catch(_) {} }

  if (!await columnExists(db, "assets", "maturity_master_id"))
    await db.execute("ALTER TABLE assets ADD COLUMN maturity_master_id INTEGER REFERENCES catalog_master_value(id)");
  if (!await columnExists(db, "assets", "effort_master_id"))
    await db.execute("ALTER TABLE assets ADD COLUMN effort_master_id INTEGER REFERENCES catalog_master_value(id)");

  for (const [code, label, ord] of [["MATURITY","Maturity",10],["CLOUD","Cloud platform",20],["EFFORT","Implementation effort",30]])
    await db.execute({ sql: "INSERT OR IGNORE INTO catalog_master_type(code,label,sort_order) VALUES (?,?,?)", args: [code,label,ord] });

  const VALS = [
    ["MATURITY","battle-tested","Battle-tested",10],["MATURITY","validated","Validated",20],["MATURITY","experimental","Experimental",30],
    ["CLOUD","aws","AWS",10],["CLOUD","gcp","GCP",20],["CLOUD","azure","Azure",30],
    ["EFFORT","low","Low",10],["EFFORT","medium","Medium",20],["EFFORT","high","High",30],
  ];
  for (const [tcode,code,label,ord] of VALS) {
    const tr = await db.execute({ sql: "SELECT id FROM catalog_master_type WHERE code=?", args: [tcode] });
    const tid = tr.rows[0]?.id;
    if (tid != null) await db.execute({ sql: "INSERT OR IGNORE INTO catalog_master_value(master_type_id,code,label,sort_order) VALUES (?,?,?,?)", args: [tid,code.toLowerCase(),label,ord] });
  }
}

async function migrateExtras(db) {
  const addA = async (col, def) => { if (!await columnExists(db,"assets",col)) await db.execute(`ALTER TABLE assets ADD COLUMN ${col} ${def}`); };
  await addA("stats_demos","INTEGER NOT NULL DEFAULT 0");
  await addA("stats_projects","INTEGER NOT NULL DEFAULT 0");
  await addA("stats_rating","INTEGER");
  await addA("attachments","TEXT NOT NULL DEFAULT '[]'");
  await addA("related_asset_ids","TEXT NOT NULL DEFAULT '[]'");
  await addA("demo_video_relpath","TEXT DEFAULT ''");
  await addA("submission_status","TEXT DEFAULT NULL");
  await addA("submission_id","TEXT DEFAULT NULL");
  if (!await columnExists(db,"activities","is_demo_seed")) await db.execute("ALTER TABLE activities ADD COLUMN is_demo_seed INTEGER NOT NULL DEFAULT 0");
  const addR = async (col,def) => { if (!await columnExists(db,"registrations",col)) await db.execute(`ALTER TABLE registrations ADD COLUMN ${col} ${def}`); };
  await addR("owner","TEXT DEFAULT ''"); await addR("team","TEXT DEFAULT ''");
  await addR("coContributors","TEXT DEFAULT ''"); await addR("version","TEXT DEFAULT ''");
  await addR("cloud","TEXT DEFAULT ''"); await addR("maturity","TEXT DEFAULT 'experimental'");
  await addR("gitUrl","TEXT DEFAULT ''"); await addR("architecture","TEXT DEFAULT ''");
  await addR("prerequisites","TEXT DEFAULT ''"); await addR("tags","TEXT DEFAULT ''");
  await addR("demo_video_relpath","TEXT DEFAULT ''"); await addR("submission_attachments","TEXT DEFAULT '[]'");
  await addR("promoted_asset_id","TEXT DEFAULT ''"); await addR("quickStart","TEXT DEFAULT ''");
}

async function backfillMasterIds(db) {
  await db.execute(`UPDATE assets SET maturity_master_id=(SELECT v.id FROM catalog_master_value v INNER JOIN catalog_master_type mt ON v.master_type_id=mt.id WHERE mt.code='MATURITY' AND LOWER(v.code)=LOWER(TRIM(assets.maturity))) WHERE maturity_master_id IS NULL AND maturity IS NOT NULL AND TRIM(maturity)!=''`);
  await db.execute(`UPDATE assets SET effort_master_id=(SELECT v.id FROM catalog_master_value v INNER JOIN catalog_master_type mt ON v.master_type_id=mt.id WHERE mt.code='EFFORT' AND LOWER(v.code)=LOWER(TRIM(assets.effort))) WHERE effort_master_id IS NULL AND effort IS NOT NULL AND TRIM(effort)!=''`);
}

async function seedUsersIfEmpty(db) {
  const r = await db.execute("SELECT COUNT(*) AS c FROM users");
  if (Number(r.rows[0]?.c ?? 0) > 0) return;
  for (const [email,name,role] of [
    ["abhilash.v@infovision.com","Abhilash Vantaram","admin"],
    ["keerthana.r@infovision.com","Keerthana R.","editor"],
    ["keerthana.rajendran@infovision.com","Keerthana Rajendran","editor"],
    ["operations.admin@infovision.com","AIMPLIFY Ops","admin"],
  ]) await db.execute({ sql:"INSERT OR IGNORE INTO users(email,name,role) VALUES (?,?,?)", args:[email,name,role] });
  console.log("✅ Seeded directory users.");
}

async function initSqlite() {
  if (_initialized) return getDb();
  const db = getDb();
  await runSchema(db);
  await migrateCatalogMasterSchema(db);
  await migrateExtras(db);
  const { applyCanonicalDemoUpserts } = require("../data/sqliteSeedDemo");
  await applyCanonicalDemoUpserts(db);
  await backfillMasterIds(db);
  try { await require("../services/sqliteService").recomputeAllFamilyStatsSqlite(); } catch(e) { console.warn("Stats reconcile skipped:", e.message); }
  await seedUsersIfEmpty(db);
  _initialized = true;
  console.log("✅ SQLite/Turso ready.");
  return db;
}

function isSqliteMode() {
  const raw = (process.env.DB_PROVIDER || process.env.DATABASE_PROVIDER || "").toLowerCase().trim();
  return raw !== "mongodb" && raw !== "mongo";
}

module.exports = { initSqlite, getDb, isSqliteMode, SQLITE_PATH_ENV: LOCAL_PATH, ASSET_FAMILY_PREFIX, migrateCatalogMasterSchema };
