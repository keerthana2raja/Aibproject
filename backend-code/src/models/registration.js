const mongoose = require("mongoose");

const findingSchema = new mongoose.Schema(
  {
    category: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pass", "warn", "fail"],
      default: "pass",
    },
    detail: { type: String, trim: true },
  },
  { _id: false },
);

const registrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      unique: true,
    }, // e.g. REG-001 — auto-generated

    name: { type: String, required: true, trim: true },

    family: {
      type: String,
      required: true,
      enum: ["atlas", "forge", "relay", "sentinel", "nexus"],
    },

    description: { type: String, required: true },

    // swagger: "submitedBy"
    submitedBy: { type: String, trim: true },

    // swagger: "date"
    date: { type: Date, default: Date.now },

    status: {
      type: String,
      // Align with frontend + prototype naming
      enum: ["ai-review", "remediation", "governance", "approved"],
      default: "ai-review",
    },

    // swagger: "aiScore"
    aiScore: { type: Number, min: 0, max: 100 },

    // swagger: "aiFindings" (RegistrationDetail)
    // Stored as structured findings for UI rendering; older string arrays remain readable
    aiFindings: { type: [findingSchema], default: [] },

    // swagger: "govReviewer" (RegistrationDetail)
    govReviewer: { type: String },

    // swagger: "govNotes" (RegistrationDetail)
    govNotes: { type: String },

    // swagger: "statusHistory[].status" + "statusHistory[].timestamp"
    statusHistory: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        changedBy: { type: String },
        note: { type: String },
      },
    ],

    demoVideoRelpath: { type: String, trim: true, default: "" },
    submissionAttachments: [
      {
        name: { type: String, trim: true },
        relpath: { type: String, trim: true },
        bytes: { type: Number },
        mimetype: { type: String, trim: true },
      },
    ],
    promotedAssetId: { type: String, trim: true, default: "" },

    /** Shell commands shown as Quick start after promotion to catalogue */
    quickStart: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

// Auto-generate REG-001 style ID before saving
registrationSchema.pre("save", async function (next) {
  if (!this.registrationId) {
    const count = await mongoose.model("Registration").countDocuments();
    this.registrationId = `REG-${String(count + 1).padStart(3, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Registration", registrationSchema);
