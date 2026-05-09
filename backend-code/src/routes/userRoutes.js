const express = require("express");
const router = express.Router();
const { listUsers } = require("../controllers/activityController");
const { getProfile, updateProfile } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);
router.get("/", protect, listUsers);

module.exports = router;
