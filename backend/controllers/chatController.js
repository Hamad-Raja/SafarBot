const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Route = require("../models/RouteM.js"); // <-- adjust model path/name
const { formatRoutesReply } = require("../utils/routeReply");

const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

exports.chatMessage = async (req, res) => {
  try {
    const { sessionId, message, text } = req.body;
    const userMsg = (message || text || "").trim();
    if (!userMsg) return res.status(400).json({ message: "Message is required." });

    const sid = sessionId || uuidv4();

    // ✅ Correct payload for FastAPI /intent
    const aiRes = await axios.post(`${FASTAPI_URL}/intent`, {
      text: userMsg,
      session_id: sid,
    });

    const intent = aiRes.data?.intent;
    const slots = aiRes.data?.slots || {};
    const criteria = { from: slots.from, to: slots.to, day: slots.day };

    let replyText = "Please tell me from and to cities.";

    // DB query only if we have from/to
    if (criteria.from && criteria.to && intent === "search_routes") {
      const routes = await Route.find({
        fromCity: new RegExp(`^${criteria.from}$`, "i"),
        toCity: new RegExp(`^${criteria.to}$`, "i"),
      }).limit(10);

      replyText = formatRoutesReply(routes, criteria);
    } else if (intent === "book_route") {
      replyText = "Booking ke liye route option number bataye (1/2/3).";
    }

    return res.json({
      sessionId: sid,
      replyText,
      criteria,
      audioUrl: null, // ✅ frontend will do TTS
    });
  } catch (err) {
    return res.status(500).json({
      message: err?.response?.data?.detail || err.message || "AI error",
    });
  }
};