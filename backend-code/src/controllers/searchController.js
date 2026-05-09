const asyncHandler = require("express-async-handler");
const { getSuggestions } = require("../services/searchService");

const search = asyncHandler(async (req, res) => {
  const data = await getSuggestions(req.query.q);
  res.status(200).json({ success: true, data });
});

module.exports = { search };
