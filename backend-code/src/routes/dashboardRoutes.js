const express = require("express");
const router = express.Router();
const { getStats, getPopular, getActivity } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

router.get("/stats", protect, getStats);
router.get("/popular", protect, getPopular);
router.get("/activity", protect, getActivity);

module.exports = router;
