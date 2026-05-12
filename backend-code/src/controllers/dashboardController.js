const asyncHandler = require("express-async-handler");
const { getDashboardStats, getPopularAssets, getRecentActivity } = require("../services/dashboardService");

// B2 FIX: Lightweight in-memory TTL cache (30 s) so that Turso DB is NOT hit
// on every request.  Avoids adding an npm dependency — a plain Map with
// timestamps is sufficient for a single-process deployment.
const TTL_MS = 30_000; // 30 seconds

const _cache = new Map(); // key → { data, expiresAt }

function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key, data) {
  _cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

const getStats = asyncHandler(async (req, res) => {
  let data = cacheGet("stats");
  if (!data) {
    data = await getDashboardStats();
    cacheSet("stats", data);
  }
  res.status(200).json({ success: true, data });
});

const getPopular = asyncHandler(async (req, res) => {
  const limit = req.query.limit ?? "6";
  const key = `popular:${limit}`;
  let data = cacheGet(key);
  if (!data) {
    data = await getPopularAssets(limit);
    cacheSet(key, data);
  }
  res.status(200).json({ success: true, data });
});

const getActivity = asyncHandler(async (req, res) => {
  const limit = req.query.limit ?? "15";
  const key = `activity:${limit}`;
  let data = cacheGet(key);
  if (!data) {
    data = await getRecentActivity(limit);
    cacheSet(key, data);
  }
  res.status(200).json({ success: true, data });
});

module.exports = { getStats, getPopular, getActivity };
