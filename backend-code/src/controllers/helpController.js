const asyncHandler = require("express-async-handler");
const helpContent = require("../data/helpContent");

const getHelp = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: helpContent });
});

module.exports = { getHelp };
