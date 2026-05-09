const { isSqliteMode } = require("../config/sqlite");
const sqlite = require("./sqliteService");
const { getCatalogMasterPayload } = require("../data/catalogMasterSeed");

exports.getCatalogMasters = () => {
  if (isSqliteMode()) {
    const { types, values } = sqlite.catalogMastersSqlite();
    return {
      types: types.map((t) => ({
        id: t.id,
        code: t.code,
        label: t.label,
        sortOrder: t.sortOrder,
      })),
      values: values.map((v) => ({
        id: v.id,
        masterTypeId: v.masterTypeId,
        typeCode: v.typeCode,
        code: v.code,
        label: v.label,
        sortOrder: v.sortOrder,
      })),
    };
  }
  return getCatalogMasterPayload();
};
