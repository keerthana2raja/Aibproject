const asyncHandler = require("express-async-handler");
const { getDashboardStats, getPopularAssets, getRecentActivity } = require("../services/dashboardService");

const getStats = asyncHandler(async (req, res) => {
  const data = await getDashboardStats();
  res.status(200).json({ success: true, data });
});

const getPopular = asyncHandler(async (req, res) => {
  const data = await getPopularAssets(req.query.limit);
  res.status(200).json({ success: true, data });
});

const getActivity = asyncHandler(async (req, res) => {
  const data = await getRecentActivity(req.query.limit);
  res.status(200).json({ success: true, data });
});

module.exports = { getStats, getPopular, getActivity };
