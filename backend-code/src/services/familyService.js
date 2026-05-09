const Family = require("../models/family");
const { isSqliteMode } = require("../config/sqlite");
const sqlite = require("./sqliteService");

const getAllFamilies = async () => {
  if (isSqliteMode()) return sqlite.familiesListSqlite();
  return await Family.find({}, "key name tagline stats");
};

const getFamilyByKey = async (key) => {
  if (isSqliteMode()) return sqlite.familyByKeySqlite(key);
  const family = await Family.findOne({ key: key.toLowerCase() });
  if (!family) throw { statusCode: 404, message: `Family '${key}' not found` };
  return family;
};

module.exports = { getAllFamilies, getFamilyByKey };
