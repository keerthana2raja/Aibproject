/**
 * Lightweight in-process TTL cache.
 * Single shared Map — no external dependency, safe for single-process / Vercel serverless.
 *
 * Usage:
 *   const cache = require("../utils/ttlCache");
 *   const data  = cache.get("key");
 *   if (!data) { data = await expensiveCall(); cache.set("key", data, 30_000); }
 */

const _store = new Map();

/** @returns {*|null} cached value, or null if missing/expired */
function get(key) {
  const entry = _store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _store.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * @param {string} key
 * @param {*}      data
 * @param {number} [ttlMs=30000]  time-to-live in milliseconds (default 30 s)
 */
function set(key, data, ttlMs = 30_000) {
  _store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/** Force-evict a key immediately (call after mutations) */
function del(key) {
  _store.delete(key);
}

/** Evict all keys whose prefix matches (e.g. "dashboard:") */
function delByPrefix(prefix) {
  for (const key of _store.keys()) {
    if (key.startsWith(prefix)) _store.delete(key);
  }
}

/** Wipe the entire cache (useful in tests) */
function clear() {
  _store.clear();
}

module.exports = { get, set, del, delByPrefix, clear };
