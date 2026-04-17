const mongoose = require("mongoose");
const FraudAlert = require("../models/FraudAlert");

const normalizeProviderKey = (value = "") =>
  String(value || "").trim().toLowerCase();

const getAlertAccessConditions = (user) => {
  const providerKey = normalizeProviderKey(user?.companyName || "");
  const orConditions = [];

  if (user?._id && mongoose.Types.ObjectId.isValid(user._id)) {
    orConditions.push({ provider: user._id });
  }

  if (providerKey) {
    orConditions.push({ providerKey });
  }

  return orConditions;
};

const getProviderFraudAlerts = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const orConditions = getAlertAccessConditions(req.user);

    if (orConditions.length === 0) {
      return res.status(400).json({ message: "Provider identity missing." });
    }

    const alerts = await FraudAlert.find({ $or: orConditions })
      .populate("booking")
      .populate("reviewedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.json(alerts);
  } catch (err) {
    console.error("getProviderFraudAlerts error:", err);
    return res.status(500).json({ message: "Unable to fetch fraud alerts." });
  }
};

const getProviderFraudAlertStats = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const orConditions = getAlertAccessConditions(req.user);

    if (orConditions.length === 0) {
      return res.status(400).json({ message: "Provider identity missing." });
    }

    const alerts = await FraudAlert.find({ $or: orConditions }).select(
      "decision score reasons reviewOutcome reviewed createdAt"
    );

    const stats = {
      totalAlerts: alerts.length,
      pendingReviews: 0,
      fraudMarked: 0,
      legitMarked: 0,
      blockedAlerts: 0,
      reviewAlerts: 0,
      highRiskAlerts: 0,
      mediumRiskAlerts: 0,
      lowRiskAlerts: 0,
      topReasons: [],
    };

    const reasonCounts = {};

    alerts.forEach((alert) => {
      const outcome = String(alert?.reviewOutcome || "PENDING").toUpperCase();
      const decision = String(alert?.decision || "").toUpperCase();
      const score = Number(alert?.score || 0);
      const reasons = Array.isArray(alert?.reasons) ? alert.reasons : [];

      if (outcome === "PENDING") stats.pendingReviews += 1;
      if (outcome === "FRAUD") stats.fraudMarked += 1;
      if (outcome === "LEGIT") stats.legitMarked += 1;

      if (decision === "BLOCK") stats.blockedAlerts += 1;
      if (decision === "REVIEW") stats.reviewAlerts += 1;

      if (score >= 70) {
        stats.highRiskAlerts += 1;
      } else if (score >= 40) {
        stats.mediumRiskAlerts += 1;
      } else {
        stats.lowRiskAlerts += 1;
      }

      reasons.forEach((reason) => {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
    });

    stats.topReasons = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));

    return res.json(stats);
  } catch (err) {
    console.error("getProviderFraudAlertStats error:", err);
    return res.status(500).json({ message: "Unable to fetch fraud alert stats." });
  }
};

const markFraudAlertReviewed = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const { id } = req.params;
    const { reviewOutcome = "PENDING", reviewNotes = "" } = req.body;

    const safeOutcome = String(reviewOutcome || "").trim().toUpperCase();
    const allowedOutcomes = ["PENDING", "FRAUD", "LEGIT"];

    if (!allowedOutcomes.includes(safeOutcome)) {
      return res.status(400).json({
        message: "Invalid reviewOutcome. Use PENDING, FRAUD, or LEGIT.",
      });
    }

    const orConditions = getAlertAccessConditions(req.user);

    if (orConditions.length === 0) {
      return res.status(400).json({ message: "Provider identity missing." });
    }

    const alert = await FraudAlert.findOne({
      _id: id,
      $or: orConditions,
    });

    if (!alert) {
      return res.status(404).json({ message: "Alert not found." });
    }

    alert.reviewed = safeOutcome !== "PENDING";
    alert.reviewOutcome = safeOutcome;
    alert.reviewNotes = String(reviewNotes || "").trim();
    alert.reviewedBy = req.user._id;
    alert.reviewedAt = safeOutcome !== "PENDING" ? new Date() : null;

    await alert.save();
    await alert.populate("reviewedBy", "name email role");

    return res.json(alert);
  } catch (err) {
    console.error("markFraudAlertReviewed error:", err);
    return res.status(500).json({ message: "Unable to update fraud alert." });
  }
};

module.exports = {
  getProviderFraudAlerts,
  getProviderFraudAlertStats,
  markFraudAlertReviewed,
};