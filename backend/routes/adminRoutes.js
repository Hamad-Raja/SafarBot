const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { listProviders, approveProvider, rejectProvider, suspendProvider } = require("../controllers/adminController");

const router = express.Router();

router.get("/providers", protect, authorize("admin"), listProviders);
router.put("/providers/:id/approve", protect, authorize("admin"), approveProvider);
router.put("/providers/:id/reject", protect, authorize("admin"), rejectProvider);
router.put("/providers/:id/suspend", protect, authorize("admin"), suspendProvider);

module.exports = router;
