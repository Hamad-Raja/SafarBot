const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    // In real-world projects, never allow fallback secrets
    throw new Error("JWT_SECRET is not set in environment variables.");
  }

  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email and password." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res
        .status(400)
        .json({ message: "User already exists with this email." });
    }

    // IMPORTANT: Only normal users can self-register
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: "user",
      // If you add flags in User schema:
      // isActive: true,
      // isApproved: true,
    });

    const token = generateToken(user);

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error during registration." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // If you add isActive / isApproved in schema, enforce here:
    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is disabled." });
    }

    if (user.role === "provider" && user.isApproved === false) {
      return res
        .status(403)
        .json({ message: "Provider account pending approval." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = generateToken(user);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error during login." });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to fetch profile." });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (password) user.password = password;

    const updated = await user.save();
    const token = generateToken(updated);

    return res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      phone: updated.phone,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to update profile." });
  }
};

const registerProvider = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      contactNumber,
      companyName,
      businessAddress,
      city,
      cnic,
      licenseNumber,
      fleetSize,
    } = req.body;

    if (
      !name || !email || !password ||
      !contactNumber || !companyName || !businessAddress || !city ||
      !cnic || !licenseNumber
    ) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "Email already in use." });
    }

    // basic CNIC format validation
    const cnicOk = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(String(cnic).trim());
    if (!cnicOk) {
      return res.status(400).json({ message: "CNIC format should be 12345-1234567-1" });
    }

    const provider = await User.create({
      name,
      email: normalizedEmail,
      password,

      role: "provider",
      providerStatus: "pending",
      isApproved: false,
      isActive: true,

      contactNumber,
      companyName,
      businessAddress,
      city,
      cnic,
      licenseNumber,
      fleetSize: fleetSize ? Number(fleetSize) : null,
    });

    return res.status(201).json({
      message: "Provider application submitted. Pending admin approval.",
      _id: provider._id,
      email: provider.email,
      role: provider.role,
      isApproved: provider.isApproved,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error during provider registration." });
  }
};

module.exports = { registerUser, loginUser, getProfile, updateProfile , registerProvider };
