const Asset = require("../models/asset");
const Registration = require("../models/registration");
const Activity = require("../models/activity");
const Family = require("../models/family");
const { isSqliteMode } = require("../config/sqlite");
const sqlite = require("./sqliteService");

const getDashboardStats = async () => {
  if (isSqliteMode()) return sqlite.dashboardStatsSqlite();

  const [
    totalAssets,
    battleTested,
    demoReady,
    deployAgg,
    pendingSubmissions,
    families,
    distinctFam,
  ] = await Promise.all([
    Asset.countDocuments(),
    Asset.countDocuments({ maturity: { $regex: /^battle-tested$/i } }),
    Asset.countDocuments({ demoReady: { $in: [true, "true"] } }),
    Asset.aggregate([{ $group: { _id: null, total: { $sum: "$stats.deploys" } } }]),
    Registration.countDocuments({ status: { $in: ["ai-review", "governance", "remediation"] } }),
    Family.find({}, "key name tagline stats"),
    Asset.distinct("family"),
  ]);

  const familyCountDistinct =
    [...new Set((distinctFam || []).map((x) => String(x || "").trim().toLowerCase()).filter(Boolean))].length ||
    families.length ||
    0;

  return {
    totalAssets,
    battleTested,
    demoReady,
    totalDeploys: deployAgg[0]?.total || 0,
    pendingSubmissions,
    notices: [],
    familyCountDistinct,
    deployMomPercent: null,
    families,
  };
};

const getPopularAssets = async (limit = 6) => {
  if (isSqliteMode()) return sqlite.popularAssetsSqlite(limit);

  return await Asset.find({}, "id name desc family clouds maturity demoReady solution stats")
    .sort({ "stats.deploys": -1 })
    .limit(Number(limit));
};

const getRecentActivity = async (limit = 15) => {
  if (isSqliteMode()) return sqlite.recentActivitiesSqlite(limit);

  return await Activity.find({})
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .select("name action description resourceType createdAt");
};

module.exports = { getDashboardStats, getPopularAssets, getRecentActivity };
