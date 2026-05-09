const asyncHandler = require("express-async-handler");
const { getAllFamilies, getFamilyByKey } = require("../services/familyService");

// GET /families
const listFamilies = asyncHandler(async (req, res) => {
  const families = await getAllFamilies();
  res.status(200).json({ success: true, count: families.length, data: families });
});

// GET /families/:key
const getFamily = asyncHandler(async (req, res) => {
  const family = await getFamilyByKey(req.params.key);
  res.status(200).json({ success: true, data: family });
});

module.exports = { listFamilies, getFamily };
