const asyncHandler = require("express-async-handler");
const { getAnalyticsSummary } = require("../services/analyticsService");
const cache = require("../utils/ttlCache");

const ANALYTICS_TTL = 120_000; // 2 minutes — analytics data changes slowly

const getSummary = asyncHandler(async (req, res) => {
  let data = cache.get("analytics:summary");
  if (!data) {
    data = await getAnalyticsSummary();
    cache.set("analytics:summary", data, ANALYTICS_TTL);
  }
  res.status(200).json({ success: true, data });
});

module.exports = { getSummary };
