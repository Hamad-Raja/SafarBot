const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["user", "provider", "admin"],
      default: "user",
    },
    // account control
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: true }, // users true, providers false

    providerStatus: {
      // UI friendly
      type: String,
      enum: ["pending", "active", "rejected", "suspended"],
      default: "pending",
    },
    // provider profile fields
    contactNumber: { type: String },
    companyName: { type: String },
    businessAddress: { type: String },
    city: { type: String },
    cnic: { type: String }, // format: 12345-1234567-1
    licenseNumber: { type: String },
    fleetSize: { type: Number },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;