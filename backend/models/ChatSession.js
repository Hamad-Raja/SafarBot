// backend/models/ChatSession.js
const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ["user", "bot"], required: true },
    type: { type: String, enum: ["text", "voice"], default: "text" },
    text: { type: String, default: "" },
    audioUrl: { type: String, default: null }, // ✅ stored URL to replay later
  },
  { timestamps: true }
);

const ChatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    messages: { type: [ChatMessageSchema], default: [] },
    lastCriteria: { type: Object, default: {} },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ChatSessionSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("ChatSession", ChatSessionSchema);