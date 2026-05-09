const Asset = require("../models/asset");
const Registration = require("../models/registration");
const { isSqliteMode } = require("../config/sqlite");
const sqlite = require("./sqliteService");

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getAnalyticsSummary = async () => {
  if (isSqliteMode()) return sqlite.analyticsSummarySqlite();

  const [
    deployAgg,
    totalAssets,
    battleTested,
    registeredCount,
    familyBreakdown,
    topAssets,
    monthlyTrend,
    topContributors,
  ] = await Promise.all([
    Asset.aggregate([{ $group: { _id: null, total: { $sum: "$stats.deploys" } } }]),
    Asset.countDocuments(),
    Asset.countDocuments({ maturity: "battle-tested" }),
    Registration.countDocuments(),

    Asset.aggregate([
      {
        $group: {
          _id: "$family",
          count: { $sum: 1 },
          deploys: { $sum: "$stats.deploys" },
        },
      },
      { $sort: { deploys: -1 } },
    ]),

    Asset.find({}, "id name family stats").sort({ "stats.deploys": -1 }).limit(5).lean(),

    Registration.aggregate([
      {
        $match: {
          date: {
            $gte: (() => {
              const d = new Date();
              d.setMonth(d.getMonth() - 5);
              d.setDate(1);
              d.setHours(0, 0, 0, 0);
              return d;
            })(),
          },
        },
      },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    Registration.aggregate([
      { $match: { submitedBy: { $ne: null, $ne: "" } } },
      { $group: { _id: "$submitedBy", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const totalDeploys = deployAgg[0]?.total || 0;

  const now = new Date();
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const found = monthlyTrend.find((t) => t._id.year === d.getFullYear() && t._id.month === d.getMonth() + 1);
    trend.push({ month: MONTH_NAMES[d.getMonth()], count: found ? found.count : 0 });
  }

  return {
    totalDeploys,
    totalAssets,
    battleTested,
    registeredCount,
    familyBreakdown,
    topAssets,
    monthlyTrend: trend,
    topContributors,
  };
};

module.exports = { getAnalyticsSummary };
