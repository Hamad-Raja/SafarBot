const express = require("express");
const router = express.Router();

const { chatMessage } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

// Text chat route
// Frontend call: POST /api/chat/message
router.post("/message", protect, chatMessage);

module.exports = router;