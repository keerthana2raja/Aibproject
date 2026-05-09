const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    // swagger ActivityEvent: "name" — who performed the action
    name: { type: String, required: true },

    // swagger ActivityEvent: "action"
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "viewed",
        "created",
        "updated",
        "deleted",
        "submitted",
        "approved",
        "rejected",
        "downloaded",
        "searched",
        "filtered",
        "registered",
        "demo_opened",
        "access_requested",
      ],
    },

    // swagger ActivityEvent: "description" — which resource was affected
    description: { type: String, default: null },

    // Internal fields (not exposed in API response)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    email: { type: String, default: "" },
    resourceType: {
      type: String,
      enum: [
        "asset",
        "registration",
        "family",
        "user",
        "dashboard",
        "auth",
        "other",
      ],
      default: "other",
    },
  },
  { timestamps: true },
);

activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
