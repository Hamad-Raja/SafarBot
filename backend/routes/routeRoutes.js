// backend/routes/routeRoutes.js
const express = require("express");
const router = express.Router();

const {
  getRoutes,
  getRouteById,
  getMyProviderRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
} = require("../controllers/routeController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Public search
router.get("/", getRoutes);

// Provider/Admin routes
router.get("/provider/my", protect, authorize("provider", "admin"), getMyProviderRoutes);
router.post("/", protect, authorize("provider", "admin"), createRoute);
router.patch("/:id", protect, authorize("provider", "admin"), updateRoute);
router.delete("/:id", protect, authorize("provider", "admin"), deleteRoute);

// Public route detail
router.get("/:id", getRouteById);

module.exports = router;