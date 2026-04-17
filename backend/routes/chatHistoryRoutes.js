// backend/routes/chatHistoryRoutes.js
const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const chatHistory = require("../controllers/chatHistoryController");

router.get("/latest", protect, chatHistory.getLatestSession);
router.delete("/session/:sessionId", protect, chatHistory.deleteSession);

module.exports = router;