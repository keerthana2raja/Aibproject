/** Static catalogue master taxonomy for Mongo-backed deployments (SQLite reads from catalog_master_* tables). */
exports.getCatalogMasterPayload = () => ({
  types: [
    { id: 1, code: "MATURITY", label: "Maturity", sortOrder: 10 },
    { id: 2, code: "CLOUD", label: "Cloud platform", sortOrder: 20 },
    { id: 3, code: "EFFORT", label: "Implementation effort", sortOrder: 30 },
  ],
  values: [
    { id: 101, masterTypeId: 1, typeCode: "MATURITY", code: "battle-tested", label: "Battle-tested", sortOrder: 10 },
    { id: 102, masterTypeId: 1, typeCode: "MATURITY", code: "validated", label: "Validated", sortOrder: 20 },
    { id: 103, masterTypeId: 1, typeCode: "MATURITY", code: "experimental", label: "Experimental", sortOrder: 30 },
    { id: 201, masterTypeId: 2, typeCode: "CLOUD", code: "aws", label: "AWS", sortOrder: 10 },
    { id: 202, masterTypeId: 2, typeCode: "CLOUD", code: "gcp", label: "GCP", sortOrder: 20 },
    { id: 203, masterTypeId: 2, typeCode: "CLOUD", code: "azure", label: "Azure", sortOrder: 30 },
    { id: 301, masterTypeId: 3, typeCode: "EFFORT", code: "low", label: "Low", sortOrder: 10 },
    { id: 302, masterTypeId: 3, typeCode: "EFFORT", code: "medium", label: "Medium", sortOrder: 20 },
    { id: 303, masterTypeId: 3, typeCode: "EFFORT", code: "high", label: "High", sortOrder: 30 },
  ],
});
