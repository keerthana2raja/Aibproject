/**
 * platformService.js
 * ------------------
 * Service layer for the Platform Families Counts & Keys API.
 * Returns per-family asset counts, all family keys, and a
 * grand total — supporting both SQLite/Turso and MongoDB modes.
 */

const { isSqliteMode, ASSET_FAMILY_PREFIX } = require("../config/sqlite");

// ── SQLite helpers ────────────────────────────────────────────────────────────

/**
 * Fetch counts per family key from the SQLite `families` table, plus a live
 * count query from `assets` so the numbers are always fresh even if the
 * materialized stats column is stale.
 */
async function _platformCountsSqlite() {
  const { getDb } = require("../config/sqlite");
  const db = getDb();

  // 1. All known family keys + their materialized stats
  const famRes = await db.execute(
    "SELECT key, name, tagline, stats_assets AS assetCount FROM families ORDER BY key"
  );

  // 2. Live per-family counts straight from the assets table
  const liveRes = await db.execute(
    "SELECT LOWER(TRIM(family)) AS family, COUNT(*) AS cnt FROM assets GROUP BY LOWER(TRIM(family))"
  );
  const liveMap = {};
  for (const row of liveRes.rows) {
    liveMap[row.family] = Number(row.cnt || 0);
  }

  const families = famRes.rows.map((r) => {
    const key = String(r.key || "").toLowerCase();
    const liveCount = liveMap[key] ?? Number(r.assetCount || 0);
    return {
      key,
      name: r.name || key,
      tagline: r.tagline || "",
      assetCount: liveCount,
      prefix: ASSET_FAMILY_PREFIX[key] || key.slice(0, 3).toUpperCase(),
    };
  });

  // 3. Total
  const totalRes = await db.execute("SELECT COUNT(*) AS c FROM assets");
  const totalAssets = Number(totalRes.rows[0]?.c || 0);

  return { families, totalAssets, keys: families.map((f) => f.key) };
}

// ── MongoDB helpers ───────────────────────────────────────────────────────────

async function _platformCountsMongo() {
  const Family = require("../models/family");
  const Asset  = require("../models/asset");

  // Aggregate live counts from assets collection
  const liveCounts = await Asset.aggregate([
    { $group: { _id: { $toLower: "$family" }, cnt: { $sum: 1 } } },
  ]);
  const liveMap = {};
  for (const doc of liveCounts) liveMap[String(doc._id || "").toLowerCase()] = doc.cnt;

  const allFamilies = await Family.find({}, "key name tagline stats").lean();

  const families = allFamilies.map((f) => {
    const key = String(f.key || "").toLowerCase();
    const liveCount = liveMap[key] ?? (f.stats?.assets || 0);
    return {
      key,
      name: f.name || key,
      tagline: f.tagline || "",
      assetCount: liveCount,
      prefix: ASSET_FAMILY_PREFIX[key] || key.slice(0, 3).toUpperCase(),
    };
  });

  const totalAssets = families.reduce((s, f) => s + f.assetCount, 0);
  return { families, totalAssets, keys: families.map((f) => f.key) };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * getPlatformCounts()
 * Returns:
 * {
 *   families: [{ key, name, tagline, assetCount, prefix }],
 *   totalAssets: number,
 *   keys: string[]           // ordered list of family keys
 * }
 */
async function getPlatformCounts() {
  return isSqliteMode() ? _platformCountsSqlite() : _platformCountsMongo();
}

/**
 * getPlatformKeys()
 * Returns just the array of known family keys (lightweight call).
 */
async function getPlatformKeys() {
  const { families } = await getPlatformCounts();
  return families.map((f) => f.key);
}

/**
 * getPlatformFamilyCount(key)
 * Returns the asset count for a single family key.
 * Throws 404 if the key is not found.
 */
async function getPlatformFamilyCount(key) {
  const { families } = await getPlatformCounts();
  const found = families.find((f) => f.key === String(key || "").toLowerCase());
  if (!found) {
    const err = new Error(`Platform family '${key}' not found`);
    err.statusCode = 404;
    throw err;
  }
  return found;
}

module.exports = { getPlatformCounts, getPlatformKeys, getPlatformFamilyCount };
