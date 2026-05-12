const asyncHandler = require("express-async-handler");
const { getDashboardStats, getPopularAssets, getRecentActivity } = require("../services/dashboardService");
const cache = require("../utils/ttlCache");

const TTL_MS = 30_000; // 30 seconds

const getStats = asyncHandler(async (req, res) => {
  let data = cache.get("dashboard:stats");
  if (!data) {
    data = await getDashboardStats();
    cache.set("dashboard:stats", data, TTL_MS);
  }
  res.status(200).json({ success: true, data });
});

const getPopular = asyncHandler(async (req, res) => {
  const limit = req.query.limit ?? "6";
  const key = `dashboard:popular:${limit}`;
  let data = cache.get(key);
  if (!data) {
    data = await getPopularAssets(limit);
    cache.set(key, data, TTL_MS);
  }
  res.status(200).json({ success: true, data });
});

const getActivity = asyncHandler(async (req, res) => {
  const limit = req.query.limit ?? "15";
  const key = `dashboard:activity:${limit}`;
  let data = cache.get(key);
  if (!data) {
    data = await getRecentActivity(limit);
    cache.set(key, data, TTL_MS);
  }
  res.status(200).json({ success: true, data });
});

module.exports = { getStats, getPopular, getActivity };
