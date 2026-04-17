const express = require("express");
const router = express.Router();

const {
  getProviderFraudAlerts,
  getProviderFraudAlertStats,
  markFraudAlertReviewed,
} = require("../controllers/fraudAlertController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Provider/Admin fraud alert routes
router.get(
  "/provider/stats",
  protect,
  authorize("provider", "admin"),
  getProviderFraudAlertStats
);

router.get(
  "/provider",
  protect,
  authorize("provider", "admin"),
  getProviderFraudAlerts
);

router.patch(
  "/:id/review",
  protect,
  authorize("provider", "admin"),
  markFraudAlertReviewed
);

module.exports = router;