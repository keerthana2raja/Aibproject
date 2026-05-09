const asyncHandler = require("express-async-handler");
const { getAnalyticsSummary } = require("../services/analyticsService");

const getSummary = asyncHandler(async (req, res) => {
  const data = await getAnalyticsSummary();
  res.status(200).json({ success: true, data });
});

module.exports = { getSummary };
