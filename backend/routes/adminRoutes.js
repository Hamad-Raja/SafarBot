const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  listProviders,
  approveProvider,
  rejectProvider,
  suspendProvider,
  getAdminDashboard,
  getAdminReports,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", protect, authorize("admin"), getAdminDashboard);
router.get("/providers", protect, authorize("admin"), listProviders);
router.put("/providers/:id/approve", protect, authorize("admin"), approveProvider);
router.put("/providers/:id/reject", protect, authorize("admin"), rejectProvider);
router.put("/providers/:id/suspend", protect, authorize("admin"), suspendProvider);
router.get("/reports", protect, authorize("admin"), getAdminReports);


module.exports = router;
