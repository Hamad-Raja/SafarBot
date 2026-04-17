// backend/controllers/chatHistoryController.js
const ChatSession = require("../models/ChatSession");

exports.getLatestSession = async (req, res) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ message: "Not authorized." });

  const s = await ChatSession.findOne({ user: userId }).sort({ updatedAt: -1 }).lean();
  if (!s) {
    return res.json({ sessionId: null, messages: [], lastCriteria: {} });
  }

  return res.json({
    sessionId: s.sessionId,
    messages: s.messages || [],
    lastCriteria: s.lastCriteria || {},
  });
};

exports.deleteSession = async (req, res) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ message: "Not authorized." });

  const { sessionId } = req.params;
  await ChatSession.deleteOne({ user: userId, sessionId });
  return res.json({ ok: true });
};