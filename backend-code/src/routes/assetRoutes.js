const express = require("express");
const router = express.Router();
const {
  listAssets,
  assetStats,
  getAsset,
  assetsByFamily,
  createAsset,
  uploadAssetDemoVideo,
} = require("../controllers/assetController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { uploadDemoVideoMulter } = require("../middleware/demoUploadMiddleware");

const runDemoUpload = (req, res, next) => {
  uploadDemoVideoMulter(req, res, (err) => {
    if (err) {
      const lim = err.code === "LIMIT_FILE_SIZE";
      const e = new Error(lim ? "Demo video must be 120MB or smaller." : err.message);
      e.statusCode = lim ? 413 : 400;
      return next(e);
    }
    next();
  });
};

// POST /assets
router.post("/", protect, authorize("admin", "editor"), createAsset);

// GET /assets
router.get("/", protect, listAssets);

// GET /assets/stats  ← must be before /:id to avoid conflict
router.get("/stats", protect, assetStats);

// GET /assets/family/:key
router.get("/family/:key", protect, assetsByFamily);

// POST /assets/:id/demo-video (before /:id GET)
router.post("/:id/demo-video", protect, authorize("admin", "editor"), runDemoUpload, uploadAssetDemoVideo);

// GET /assets/:id
router.get("/:id", protect, getAsset);

module.exports = router;
