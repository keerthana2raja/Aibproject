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
const cache = require("../utils/ttlCache");

const TTL_MS = 30_000; // 30 seconds

// ── GET /v1/platform/counts ───────────────────────────────────────────────────
const getAllCounts = asyncHandler(async (_req, res) => {
  let result = cache.get("platform:counts");
  if (!result) {
    result = await getPlatformCounts();
    cache.set("platform:counts", result, TTL_MS);
  }
  const { families, totalAssets } = result;
  res.status(200).json({
    success: true,
    totalFamilies: families.length,
    totalAssets,
    data: families,
  });
});

// ── GET /v1/platform/keys ─────────────────────────────────────────────────────
const getAllKeys = asyncHandler(async (_req, res) => {
  let keys = cache.get("platform:keys");
  if (!keys) {
    keys = await getPlatformKeys();
    cache.set("platform:keys", keys, TTL_MS);
  }
  res.status(200).json({ success: true, count: keys.length, keys });
});

// ── GET /v1/platform/counts/:key ──────────────────────────────────────────────
const getFamilyCount = asyncHandler(async (req, res) => {
  const cacheKey = `platform:family:${String(req.params.key).toLowerCase()}`;
  let family = cache.get(cacheKey);
  if (!family) {
    family = await getPlatformFamilyCount(req.params.key);
    cache.set(cacheKey, family, TTL_MS);
  }
  res.status(200).json({ success: true, data: family });
});

module.exports = { getAllCounts, getAllKeys, getFamilyCount };
