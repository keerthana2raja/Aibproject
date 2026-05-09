const express = require("express");
const router = express.Router();
const { listFamilies, getFamily } = require("../controllers/familyController");
const { protect } = require("../middleware/authMiddleware");

// GET /families
router.get("/", protect, listFamilies);

// GET /families/:key
router.get("/:key", protect, getFamily);

module.exports = router;
