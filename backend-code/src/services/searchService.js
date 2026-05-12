const Asset = require("../models/asset");
const Family = require("../models/family");
const { isSqliteMode } = require("../config/sqlite");
const sqlite = require("./sqliteService");

const getSuggestions = async (q) => {
  const empty = { assets: [], families: [] };
  if (isSqliteMode()) return sqlite.searchSuggestionsSqlite(q);
  if (!q || !q.trim()) return empty;

  const [assets, directFamilies] = await Promise.all([
    Asset.find(
      { $or: [
        { $text: { $search: q } },
        { id:       { $regex: q, $options: "i" } },
        { owner:    { $regex: q, $options: "i" } },
        { clouds:   { $regex: q, $options: "i" } },
        { maturity: { $regex: q, $options: "i" } },
        { effort:   { $regex: q, $options: "i" } },
        { solution: { $regex: q, $options: "i" } },
      ]},
      { id: 1, name: 1, family: 1, score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(6),
    Family.find(
      { $or: [
        { name: { $regex: q, $options: "i" } },
        { tagline: { $regex: q, $options: "i" } },
        { longDesc: { $regex: q, $options: "i" } },
        { solutions: { $regex: q, $options: "i" } },
        { useCases: { $regex: q, $options: "i" } },
      ]},
      "key name tagline"
    ).limit(4),
  ]);

  // Collect family keys already returned by direct family match
  const directFamilyKeys = new Set(directFamilies.map((f) => String(f.key).toLowerCase()));

  // For each matched asset, fetch its parent family if not already included
  const assetFamilyKeys = [...new Set(
    assets
      .map((a) => String(a.family || "").toLowerCase())
      .filter((fk) => fk && !directFamilyKeys.has(fk))
  )];

  let extraFamilies = [];
  if (assetFamilyKeys.length) {
    extraFamilies = await Family.find(
      { key: { $in: assetFamilyKeys } },
      "key name tagline"
    ).limit(4);
  }

  const allFamilies = [
    ...directFamilies.map((f) => ({ id: f.key, name: f.name, tagline: f.tagline, type: "family" })),
    ...extraFamilies.map((f) => ({ id: f.key, name: f.name, tagline: f.tagline, type: "family" })),
  ];

  // If no assets matched directly but families matched, fetch assets belonging to those families
  let allAssets = assets.map((a) => ({ id: a.id, name: a.name, family: a.family, type: "asset" }));
  if (allAssets.length === 0 && allFamilies.length > 0) {
    const familyKeysForAssets = allFamilies.map((f) => String(f.id).toLowerCase());
    const fallbackAssets = await Asset.find(
      { family: { $in: familyKeysForAssets } },
      { id: 1, name: 1, family: 1 }
    )
      .sort({ "stats.deploys": -1 })
      .limit(6);
    allAssets = fallbackAssets.map((a) => ({ id: a.id, name: a.name, family: a.family, type: "asset" }));
  }

  return {
    assets: allAssets,
    families: allFamilies,
  };
};

module.exports = { getSuggestions };
