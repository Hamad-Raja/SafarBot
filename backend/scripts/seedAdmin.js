require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.log("❌ Please set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env");
      process.exit(1);
    }

    const existing = await User.findOne({ email });

    if (existing) {
      existing.role = "admin";
      existing.isActive = true;
      existing.isApproved = true;
      await existing.save();
      console.log("✅ Admin already existed. Updated role to admin:", email);
    } else {
      await User.create({
        name: "SafarBot Admin",
        email,
        password,     // will be hashed by pre-save hook
        role: "admin",
        isActive: true,
        isApproved: true,
      });
      console.log("✅ Admin created:", email);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seedAdmin();
