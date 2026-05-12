const express = require("express");
const router = express.Router();
const { getStats, getPopular, getActivity } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

// B3 FIX: Add Cache-Control headers on every dashboard GET so the CDN edge
// can serve cached responses for up to 60 s, and the browser can use a stale
// copy while revalidating in the background instead of re-fetching on every
// navigation.
const setCacheHeaders = (_req, res, next) => {
  res.set("Cache-Control", "s-maxage=60, stale-while-revalidate");
  next();
};

router.get("/stats",    protect, setCacheHeaders, getStats);
router.get("/popular",  protect, setCacheHeaders, getPopular);
router.get("/activity", protect, setCacheHeaders, getActivity);

module.exports = router;
