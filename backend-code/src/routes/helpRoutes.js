const express = require("express");
const router = express.Router();
const { getHelp } = require("../controllers/helpController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getHelp);

module.exports = router;
