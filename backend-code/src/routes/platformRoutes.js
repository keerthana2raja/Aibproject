/**
 * platformRoutes.js
 * ─────────────────
 * REST routes for platform family counts and keys.
 *
 * All routes are protected (JWT required) and carry a 60-second
 * CDN cache header consistent with the other dashboard/family routes.
 *
 * Registered in app.js at: /v1/platform
 *
 * Route map:
 *   GET /v1/platform/counts          → list all families with asset counts
 *   GET /v1/platform/keys            → list of family keys only (lightweight)
 *   GET /v1/platform/counts/:key     → single family count by key
 */

const express = require("express");
const router = express.Router();
const {
  getAllCounts,
  getAllKeys,
  getFamilyCount,
} = require("../controllers/platformController");
const { protect } = require("../middleware/authMiddleware");

// Shared CDN cache header (matches policy in familyRoutes / dashboardRoutes)
const setCacheHeaders = (_req, res, next) => {
  res.set("Cache-Control", "s-maxage=60, stale-while-revalidate");
  next();
};

// GET /v1/platform/counts
router.get("/counts", setCacheHeaders, getAllCounts);

// GET /v1/platform/keys
router.get("/keys", protect, setCacheHeaders, getAllKeys);

// GET /v1/platform/counts/:key  (e.g. /v1/platform/counts/atlas)
router.get("/counts/:key", protect, setCacheHeaders, getFamilyCount);

module.exports = router;
