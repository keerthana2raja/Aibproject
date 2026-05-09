const express = require("express");
const router = express.Router();
const { listCatalogMasters } = require("../controllers/catalogController");
const { protect } = require("../middleware/authMiddleware");

router.get("/masters", protect, listCatalogMasters);

module.exports = router;
