/**
 * platformController.js
 * ─────────────────────
 * Handles all requests for the /v1/platform route group.
 *
 * Endpoints exposed:
 *   GET /v1/platform/counts        → all families with asset counts + totals
 *   GET /v1/platform/keys          → just the list of family keys
 *   GET /v1/platform/counts/:key   → single-family count detail
 */

const asyncHandler = require("express-async-handler");
const {
  getPlatformCounts,
  getPlatformKeys,
  getPlatformFamilyCount,
} = require("../services/platformService");

// ── GET /v1/platform/counts ───────────────────────────────────────────────────
/**
 * Returns every platform family with its live asset count.
 *
 * Response shape:
 * {
 *   "success": true,
 *   "totalFamilies": 5,
 *   "totalAssets": 18,
 *   "keys": ["atlas", "forge", "nexus", "relay", "sentinel"],
 *   "data": [
 *     { "key": "atlas",    "name": "Atlas",    "tagline": "...", "assetCount": 3, "prefix": "ATL" },
 *     { "key": "forge",    "name": "Forge",    "tagline": "...", "assetCount": 5, "prefix": "FRG" },
 *     { "key": "nexus",    "name": "Nexus",    "tagline": "...", "assetCount": 2, "prefix": "NXS" },
 *     { "key": "relay",    "name": "Relay",    "tagline": "...", "assetCount": 5, "prefix": "RLY" },
 *     { "key": "sentinel", "name": "Sentinel", "tagline": "...", "assetCount": 3, "prefix": "SEN" }
 *   ]
 * }
 */
const getAllCounts = asyncHandler(async (_req, res) => {
  const { families, totalAssets, keys } = await getPlatformCounts();
  res.status(200).json({
    success: true,
    totalFamilies: families.length,
    totalAssets,
    data: families,
  });
});

// ── GET /v1/platform/keys ─────────────────────────────────────────────────────
/**
 * Lightweight endpoint returning only the ordered list of family keys.
 *
 * Response shape:
 * {
 *   "success": true,
 *   "count": 5,
 *   "keys": ["atlas", "forge", "nexus", "relay", "sentinel"]
 * }
 */
const getAllKeys = asyncHandler(async (_req, res) => {
  const keys = await getPlatformKeys();
  res.status(200).json({ success: true, count: keys.length, keys });
});

// ── GET /v1/platform/counts/:key ──────────────────────────────────────────────
/**
 * Returns count detail for a single family key.
 *
 * Response shape:
 * {
 *   "success": true,
 *   "data": { "key": "atlas", "name": "Atlas", "tagline": "...", "assetCount": 3, "prefix": "ATL" }
 * }
 */
const getFamilyCount = asyncHandler(async (req, res) => {
  const family = await getPlatformFamilyCount(req.params.key);
  res.status(200).json({ success: true, data: family });
});

module.exports = { getAllCounts, getAllKeys, getFamilyCount };
