const Asset = require("../models/asset");
const Family = require("../models/family");
const { isSqliteMode } = require("../config/sqlite");
const sqlite = require("./sqliteService");

const getSuggestions = async (q) => {
  const empty = { assets: [], families: [] };
  if (isSqliteMode()) return sqlite.searchSuggestionsSqlite(q);
  if (!q || !q.trim()) return empty;

  const [assets, families] = await Promise.all([
    Asset.find(
      { $text: { $search: q } },
      { id: 1, name: 1, family: 1, score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(6),
    Family.find({ name: { $regex: q, $options: "i" } }, "key name tagline").limit(3),
  ]);

  return {
    assets: assets.map((a) => ({ id: a.id, name: a.name, family: a.family, type: "asset" })),
    families: families.map((f) => ({ id: f.key, name: f.name, tagline: f.tagline, type: "family" })),
  };
};

module.exports = { getSuggestions };
