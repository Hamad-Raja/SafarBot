const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // New proper references
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RouteM",
      default: null,
      index: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Device / request fingerprint fields
    deviceId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },

    userAgent: {
      type: String,
      default: "",
      trim: true,
    },

    // Legacy/simple fields kept for backward compatibility
    routeId: {
      type: String,
      default: "",
      trim: true,
    },

    operator: {
      type: String,
      default: "",
      trim: true,
    },

    from: {
      type: String,
      default: "",
      trim: true,
    },

    to: {
      type: String,
      default: "",
      trim: true,
    },

    departureTime: {
      type: String,
      default: "",
      trim: true,
    },

    seats: {
      type: [String],
      default: [],
    },

    seatCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentProvider: {
      type: String,
      default: "",
      trim: true,
    },

    paymentStatus: {
      type: String,
      enum: ["", "PAID", "UNPAID", "FAILED", "REFUNDED"],
      default: "",
      trim: true,
    },

    stripeSessionId: {
      type: String,
      default: "",
      trim: true,
    },

    stripePaymentIntentId: {
      type: String,
      default: "",
      trim: true,
    },

    travelDate: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "REVIEW", "BLOCKED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    fraud: {
      score: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },

      decision: {
        type: String,
        enum: ["ALLOW", "REVIEW", "BLOCK"],
        default: null,
      },

      reasons: {
        type: [String],
        default: [],
      },

      rule_score: {
        type: Number,
        default: null,
      },

      ml_score: {
        type: Number,
        default: null,
      },

      ml_prob: {
        type: Number,
        default: null,
        min: 0,
        max: 1,
      },

      checkedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Helpful indexes
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ provider: 1, createdAt: -1 });
bookingSchema.index({ route: 1, createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ from: 1, to: 1, travelDate: 1 });
bookingSchema.index({ deviceId: 1, createdAt: -1 });
bookingSchema.index({ stripeSessionId: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
