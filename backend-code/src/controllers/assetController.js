const path = require("path");
const asyncHandler = require("express-async-handler");
const {
  getAssets,
  getAssetStats,
  getAssetById,
  getAssetsByFamily,
  createCatalogAsset,
  attachDemoVideoToAsset,
} = require("../services/assetService");
const { uploadToBlob } = require("../utils/blobUpload");
const cache = require("../utils/ttlCache");

const STATS_TTL = 30_000; // 30 seconds

// GET /assets
const listAssets = asyncHandler(async (req, res) => {
  const assets = await getAssets(req.query);
  res.status(200).json({ success: true, count: assets.length, data: assets });
});

// GET /assets/stats
const assetStats = asyncHandler(async (req, res) => {
  let data = cache.get("assets:stats");
  if (!data) {
    data = await getAssetStats();
    cache.set("assets:stats", data, STATS_TTL);
  }
  res.status(200).json({ success: true, data });
});

// GET /assets/:id
const getAsset = asyncHandler(async (req, res) => {
  const asset = await getAssetById(req.params.id);
  res.status(200).json({ success: true, data: asset });
});

// GET /assets/family/:key
const assetsByFamily = asyncHandler(async (req, res) => {
  const assets = await getAssetsByFamily(req.params.key);
  res.status(200).json({ success: true, count: assets.length, data: assets });
});

// POST /assets
const createAsset = asyncHandler(async (req, res) => {
  const asset = await createCatalogAsset(req.body || {}, req.user || {});
  // Bust all count/stats caches after a new asset is added
  cache.del("assets:stats");
  cache.del("dashboard:stats");
  cache.del("platform:counts");
  cache.del("platform:keys");
  cache.delByPrefix("platform:family:");
  cache.delByPrefix("families:");
  res.status(201).json({ success: true, data: asset });
});

// POST /assets/:id/demo-video  (multipart field name: "demo")
// File is held in memory by multer; we push it straight to Vercel Blob.
const uploadAssetDemoVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'Attach a video file using the form field name "demo" (MP4, WebM, or MOV).',
    });
    return;
  }

  const assetId = String(req.params.id).toUpperCase().replace(/[^\w-]/g, "") || "ASSET";
  const extRaw  = path.extname(req.file.originalname || "");
  const ext     = /\.(mp4|webm|mov)$/i.test(extRaw) ? extRaw.toLowerCase() : ".mp4";
  const pathname = `demos/${assetId}-${Date.now()}${ext}`;

  const blobUrl = await uploadToBlob(pathname, req.file.buffer, req.file.mimetype || "video/mp4");

  const asset = await attachDemoVideoToAsset(req.params.id, blobUrl);
  res.status(200).json({ success: true, data: asset });
});

module.exports = { listAssets, assetStats, getAsset, assetsByFamily, createAsset, uploadAssetDemoVideo };
