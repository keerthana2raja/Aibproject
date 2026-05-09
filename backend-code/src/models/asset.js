const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    // swagger: "id" e.g. ATL-001
    id: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // swagger: "name"
    name: { type: String, required: true, trim: true },

    // swagger: "desc"
    desc: { type: String, trim: true },

    // swagger: "family"
    family: {
      type: String,
      required: true,
      enum: ["atlas", "forge", "relay", "sentinel", "nexus"],
    },

    // swagger: "clouds"
    clouds: [{ type: String, enum: ["aws", "gcp", "azure"] }],

    // swagger: "maturity"
    maturity: {
      type: String,
      enum: ["experimental", "validated", "battle-tested"],
      default: "experimental",
    },

    // swagger: "effort"
    effort: { type: String, trim: true },

    // swagger: "demoReady"
    demoReady: { type: Boolean, default: false },

    // swagger: "solution"
    solution: { type: String, trim: true },

    /** Relative path under /v1/uploads (e.g. demos/ATL-001-123.mp4) */
    demoVideoRelpath: { type: String, trim: true, default: "" },

    // swagger AssetDetail: "owner"
    owner: { type: String, trim: true },

    ownerInitials: { type: String, trim: true },

    // swagger AssetDetail: "architecture" (uri to diagram image)
    architecture: { type: String, trim: true },

    // swagger AssetDetail: "quickStart"
    quickStart: { type: String },

    // swagger AssetDetail: "prerequisites"
    prerequisites: [{ type: String }],

    // swagger AssetDetail: "tags"
    tags: [{ type: String }],

    // swagger AssetDetail: "changelog"
    changelog: [{ type: String }],

    // swagger AssetDetail: "stats.deploys" + "stats.stars"
    stats: {
      deploys: { type: Number, default: 0 },
      stars: { type: Number, default: 0 },
      demos: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

// Full-text search index on name, desc, tags
assetSchema.index({ name: "text", desc: "text", tags: "text" });

module.exports = mongoose.model("Asset", assetSchema);
