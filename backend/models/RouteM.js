const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
  {
    routeId: {
      type: String,
      default: "",
      trim: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    operator: {
      type: String,
      default: "",
      trim: true,
    },

    busName: {
      type: String,
      default: "",
      trim: true,
    },

    busType: {
      type: String,
      default: "",
      trim: true,
    },

    fromCity: {
      type: String,
      required: true,
      trim: true,
    },

    toCity: {
      type: String,
      required: true,
      trim: true,
    },

    travelDate: {
      type: String,
      default: "",
      trim: true,
    },

    departureTime: {
      type: String,
      required: true,
      trim: true,
    },

    arrivalTime: {
      type: String,
      default: "",
      trim: true,
    },

    duration: {
      type: String,
      default: "",
      trim: true,
    },

    availableSeats: {
      type: Number,
      default: 0,
      min: 0,
    },

    // NEW: actual reserved/booked seat labels
    bookedSeats: {
      type: [String],
      default: [],
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

routeSchema.index({ fromCity: 1, toCity: 1, travelDate: 1, active: 1 });
routeSchema.index({ provider: 1, active: 1 });

module.exports = mongoose.model("RouteM", routeSchema);