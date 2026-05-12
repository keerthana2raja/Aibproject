const asyncHandler = require("express-async-handler");
const { getCatalogMasters } = require("../services/catalogService");
const cache = require("../utils/ttlCache");

const CATALOG_TTL = 300_000; // 5 minutes — catalog master values almost never change

const listCatalogMasters = asyncHandler(async (req, res) => {
  let data = cache.get("catalog:masters");
  if (!data) {
    data = await getCatalogMasters();
    cache.set("catalog:masters", data, CATALOG_TTL);
  }
  res.status(200).json({ success: true, data });
});

module.exports = { listCatalogMasters };
