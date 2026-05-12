const asyncHandler = require("express-async-handler");
const { getAllFamilies, getFamilyByKey } = require("../services/familyService");
const cache = require("../utils/ttlCache");

const TTL_MS = 30_000; // 30 seconds

// GET /families
const listFamilies = asyncHandler(async (req, res) => {
  let families = cache.get("families:all");
  if (!families) {
    families = await getAllFamilies();
    cache.set("families:all", families, TTL_MS);
  }
  res.status(200).json({ success: true, count: families.length, data: families });
});

// GET /families/:key
const getFamily = asyncHandler(async (req, res) => {
  const key = `families:${String(req.params.key).toLowerCase()}`;
  let family = cache.get(key);
  if (!family) {
    family = await getFamilyByKey(req.params.key);
    cache.set(key, family, TTL_MS);
  }
  res.status(200).json({ success: true, data: family });
});

module.exports = { listFamilies, getFamily };
