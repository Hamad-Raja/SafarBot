const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { voiceChat } = require("../controllers/voiceController");
const { protect } = require("../middleware/authMiddleware");

router.post("/chat", protect, upload.single("audio"), voiceChat);

module.exports = router;