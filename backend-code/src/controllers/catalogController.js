const asyncHandler = require("express-async-handler");
const { getCatalogMasters } = require("../services/catalogService");

const listCatalogMasters = asyncHandler(async (req, res) => {
  const data = await getCatalogMasters();
  res.status(200).json({ success: true, data });
});

module.exports = { listCatalogMasters };
