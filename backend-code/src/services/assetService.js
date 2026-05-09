const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const Asset = require("../models/asset");
const Family = require("../models/family");
const Activity = require("../models/activity");
const { isSqliteMode, ASSET_FAMILY_PREFIX } = require("../config/sqlite");
const { demoVideoUrlFromRelpath } = require("../utils/demoVideoUrl");
const sqlite = require("./sqliteService");

const MONGO_LIST_FIELDS =
  "id name desc family clouds maturity effort demoReady solution owner stats demoVideoRelpath";

function enrichMongoAssetLean(o) {
  if (!o) return o;
  const raw = typeof o.toObject === "function" ? o.toObject() : { ...o };
  const rel = String(raw.demoVideoRelpath || "").trim();
  const demoVideoUrl = demoVideoUrlFromRelpath(rel || undefined);
  const sd = raw.stats?.deploys ?? 0;
  const ss = raw.stats?.stars ?? 0;
  let demos = raw.stats?.demos;
  if (demos == null) demos = demoVideoUrl ? 1 : 0;
  return {
    ...raw,
    demoVideoUrl,
    stats: { deploys: sd, stars: ss, demos: Number(demos) || 0 },
  };
}

async function unlinkDemoIfPresent(relativePath) {
  const s = String(relativePath || "")
    .trim()
    .replace(/^\/+/, "");
  if (!s) return;
  try {
    const full = path.join(process.cwd(), "data", "uploads", s);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (_) {
    /* ignore */
  }
}

// GET /assets — list with filters
const getAssets = async (filters) => {
  if (isSqliteMode()) return sqlite.assetsListSqlite(filters);
  const query = {};
  if (filters.family) query.family = filters.family.toLowerCase();
  if (filters.maturity)
    query.maturity = { $regex: new RegExp(`^${filters.maturity}$`, "i") };
  if (filters.demoReady !== undefined)
    query.demoReady = filters.demoReady === "true";
  if (filters.cloud) {
    const clouds = filters.cloud.split(",").map((c) => c.trim().toLowerCase());
    query.clouds = { $in: clouds };
  }
  if (filters.q) query.$text = { $search: filters.q };

  const rows = await Asset.find(query, MONGO_LIST_FIELDS).lean();
  return rows.map(enrichMongoAssetLean);
};

// GET /assets/stats
const getAssetStats = async () => {
  if (isSqliteMode()) return sqlite.assetsStatsSqlite();
  const [totalAssets, battleTested, demoReady, deployAgg, topRows] =
    await Promise.all([
      Asset.countDocuments(),
      Asset.countDocuments({ maturity: { $regex: /^battle-tested$/i } }),
      Asset.countDocuments({ demoReady: { $in: [true, "true"] } }),
      Asset.aggregate([
        { $group: { _id: null, total: { $sum: "$stats.deploys" } } },
      ]),
      Asset.find({}, MONGO_LIST_FIELDS)
        .sort({ "stats.deploys": -1 })
        .limit(5)
        .lean(),
    ]);
  return {
    totalAssets,
    battleTested,
    demoReady,
    totalDeploys: deployAgg[0]?.total || 0,
    topAssets: topRows.map(enrichMongoAssetLean),
  };
};

// GET /assets/:id — lookup by custom id (ATL-001) or MongoDB _id
const getAssetById = async (id) => {
  if (isSqliteMode()) return sqlite.assetByIdSqlite(id);
  let asset = await Asset.findOne({ id: id.toUpperCase() }).lean();
  if (!asset && mongoose.Types.ObjectId.isValid(id)) {
    asset = await Asset.findById(id).lean();
  }
  if (!asset) throw { statusCode: 404, message: `Asset '${id}' not found` };
  return { ...enrichMongoAssetLean(asset), relatedAssets: [] };
};

// GET /assets/family/:key
const getAssetsByFamily = async (key) => {
  if (isSqliteMode()) return sqlite.assetsByFamilySqlite(key);
  const assets = await Asset.find(
    { family: key.toLowerCase() },
    MONGO_LIST_FIELDS,
  ).lean();
  return assets.map(enrichMongoAssetLean);
};

function initialsFromOwner(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

async function refreshFamilyStatsMongo(familyKey) {
  const fk = String(familyKey).toLowerCase();
  const agg = await Asset.aggregate([
    { $match: { family: fk } },
    {
      $group: {
        _id: null,
        assets: { $sum: 1 },
        deploys: { $sum: "$stats.deploys" },
        battleTested: {
          $sum: {
            $cond: [
              { $eq: [{ $toLower: "$maturity" }, "battle-tested"] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const row = agg[0] || { assets: 0, deploys: 0, battleTested: 0 };
  await Family.updateOne(
    { key: fk },
    {
      $set: {
        "stats.assets": row.assets || 0,
        "stats.deploys": row.deploys || 0,
        "stats.battleTested": row.battleTested || 0,
      },
    },
  );
}

const createCatalogAsset = async (body, actor = {}) => {
  if (isSqliteMode()) return sqlite.assetCreateSqlite(body, actor);

  const family = String(body.family || "")
    .trim()
    .toLowerCase();
  const famExists = await Family.findOne({ key: family });
  if (!famExists)
    throw { statusCode: 400, message: `Unknown family '${body.family}'` };

  const matAllowed = Asset.schema.paths.maturity.enumValues;
  const maturity = String(body.maturity || "experimental")
    .trim()
    .toLowerCase();
  if (!matAllowed.includes(maturity))
    throw { statusCode: 400, message: `Unknown maturity '${body.maturity}'` };

  let effort = String(body.effort || "medium")
    .trim()
    .toLowerCase();
  if (!["low", "medium", "high"].includes(effort)) effort = "medium";

  const cloudEnum = ["aws", "gcp", "azure"];
  const cloudsIn = Array.isArray(body.clouds) ? body.clouds : [];
  const clouds = [
    ...new Set(
      cloudsIn.map((c) => String(c).trim().toLowerCase()).filter(Boolean),
    ),
  ];
  for (const c of clouds) {
    if (!cloudEnum.includes(c))
      throw { statusCode: 400, message: `Unknown cloud '${c}'` };
  }

  const prefixRaw =
    ASSET_FAMILY_PREFIX[family] || family.slice(0, 3).toUpperCase();
  const prefix = String(prefixRaw)
    .replace(/[^A-Z]/gi, "X")
    .padEnd(3, "X")
    .slice(0, 3);

  let id = body.id ? String(body.id).trim().toUpperCase() : null;
  if (id) {
    const clash = await Asset.findOne({ id });
    if (clash)
      throw { statusCode: 409, message: `Asset id '${id}' already exists` };
  } else {
    const found = await Asset.find({ family })
      .select("id")
      .sort({ id: -1 })
      .limit(500)
      .lean();
    let max = 0;
    const seqRe = new RegExp(`^${prefix}-(\\d+)$`, "i");
    found.forEach((d) => {
      const m = String(d.id).match(seqRe);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    id = `${prefix}-${String(max + 1).padStart(3, "0")}`;
  }

  const name = String(body.name || "").trim();
  if (!name) throw { statusCode: 400, message: "Asset name is required" };

  const owner = String(body.owner || actor.name || "").trim();
  const doc = await Asset.create({
    id,
    name,
    desc: String(body.desc || "").trim(),
    family,
    clouds,
    maturity,
    effort,
    demoReady: !!(
      body.demoReady === true ||
      body.demoReady === "true" ||
      body.demoReady === 1
    ),
    solution: String(body.solution || "").trim(),
    owner,
    ownerInitials:
      String(body.ownerInitials || "").trim() || initialsFromOwner(owner),
    stats: {
      deploys: Math.max(0, parseInt(body.statsDeploys, 10) || 0),
      stars: Math.max(0, parseInt(body.statsStars, 10) || 0),
      demos: 0,
    },
  });

  await refreshFamilyStatsMongo(family);
  await Activity.create({
    name: actor.name || actor.email || "User",
    email: actor.email || "",
    action: "created",
    resourceType: "asset",
    description: id,
  });

  return getAssetById(doc.id);
};

/** Save relative path like `demos/ATL-001-123.mp4` under data/uploads */
const attachDemoVideoToAsset = async (assetId, relativePath) => {
  if (isSqliteMode())
    return sqlite.assetSetDemoVideoSqlite(assetId, relativePath);
  const uid = String(assetId).toUpperCase();
  const prevRow = await Asset.findOne({ id: uid })
    .select("demoVideoRelpath")
    .lean();
  if (!prevRow)
    throw { statusCode: 404, message: `Asset '${assetId}' not found` };
  const prev = String(prevRow.demoVideoRelpath || "").trim();
  if (prev && prev !== relativePath) await unlinkDemoIfPresent(prev);
  await Asset.updateOne(
    { id: uid },
    {
      $set: {
        demoVideoRelpath: relativePath,
        demoReady: true,
        "stats.demos": 1,
      },
    },
  );
  return getAssetById(uid);
};

module.exports = {
  getAssets,
  getAssetStats,
  getAssetById,
  getAssetsByFamily,
  createCatalogAsset,
  attachDemoVideoToAsset,
};
