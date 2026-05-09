const mongoose = require("mongoose");

const familySchema = new mongoose.Schema(
  {
    // swagger: "key"
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      enum: ["atlas", "forge", "relay", "sentinel", "nexus"],
    },

    // swagger: "name"
    name: { type: String, required: true, trim: true },

    // swagger: "tagline"
    tagline: { type: String, trim: true },

    // swagger FamilyDetail: "longDesc"
    longDesc: { type: String },

    // swagger FamilyDetail: "useCases"
    useCases: [{ type: String }],

    // swagger FamilyDetail: "solutions"
    solutions: [{ type: String }],

    // swagger FamilyDetail: "dependsOn"
    dependsOn: [{ type: String }],

    // swagger FamilyDetail: "enables"
    enables: [{ type: String }],

    // swagger: "assetCount" (summary) + FamilyDetail "stats"
    stats: {
      assets: { type: Number, default: 0 },
      deploys: { type: Number, default: 0 },
      battleTested: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Family", familySchema);
