const express = require("express");
const router = express.Router();
const { listActivity, createActivityEntry } = require("../controllers/activityController");
const { protect } = require("../middleware/authMiddleware");

// swagger: GET /activity
router.get("/", protect, listActivity);
router.post("/", protect, createActivityEntry);

module.exports = router;
