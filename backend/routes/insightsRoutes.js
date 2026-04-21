const express = require("express");
const router = express.Router();

const {
  getRouteInsights,
  runInsightsDelayAgent,
  sendRouteDelayAlert,
  testMail,
} = require("../controllers/insightsController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/route/:id", getRouteInsights);

router.post(
  "/route/:id/send-alert",
  protect,
  authorize("provider", "admin"),
  sendRouteDelayAlert
);

router.post(
  "/run-delay-agent",
  protect,
  authorize("admin"),
  runInsightsDelayAgent
);

router.get("/test-mail", testMail);

module.exports = router;