const express = require("express");
const router = express.Router();
const { listFamilies, getFamily } = require("../controllers/familyController");
const { protect } = require("../middleware/authMiddleware");

// B3 FIX: Add Cache-Control headers on family GET routes so the CDN edge
// can serve cached responses for up to 60 s with stale-while-revalidate,
// matching the same policy applied to dashboard and asset routes.
const setCacheHeaders = (_req, res, next) => {
  res.set("Cache-Control", "s-maxage=60, stale-while-revalidate");
  next();
};

// GET /families
router.get("/", protect, setCacheHeaders, listFamilies);

// GET /families/:key
router.get("/:key", protect, setCacheHeaders, getFamily);

module.exports = router;
