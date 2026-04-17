const mongoose = require("mongoose");

const fraudAlertSchema = new mongoose.Schema(
  {
    // New production-safe relation
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Temporary legacy field for backward compatibility
    providerKey: {
      type: String,
      default: "",
      index: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    decision: {
      type: String,
      enum: ["REVIEW", "BLOCK"],
      required: true,
      trim: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    reasons: {
      type: [String],
      default: [],
    },

    // Human review status
    reviewed: {
      type: Boolean,
      default: false,
    },

    reviewOutcome: {
      type: String,
      enum: ["PENDING", "FRAUD", "LEGIT"],
      default: "PENDING",
      index: true,
    },

    reviewNotes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Helpful indexes
fraudAlertSchema.index({ provider: 1, createdAt: -1 });
fraudAlertSchema.index({ providerKey: 1, createdAt: -1 });
fraudAlertSchema.index({ booking: 1 });
fraudAlertSchema.index({ reviewOutcome: 1, createdAt: -1 });

module.exports = mongoose.model("FraudAlert", fraudAlertSchema);