const asyncHandler = require("express-async-handler");
const { getCatalogMasters } = require("../services/catalogService");

const listCatalogMasters = asyncHandler(async (req, res) => {
  const data = getCatalogMasters();
  res.status(200).json({ success: true, data });
});

module.exports = { listCatalogMasters };
