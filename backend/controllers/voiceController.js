// backend/controllers/voiceController.js
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const ChatSession = require("../models/ChatSession");

const AI_SERVICE_URL = (
  process.env.AI_SERVICE_URL ||
  process.env.FASTAPI_URL ||
  "https://eshanelahi0-safarbot-voice-api.hf.space"
).replace(/\/$/, "");

const AI_SERVICE_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS || 180000);

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "voice");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const sessions = new Map();

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      conversationState: null,
      lastRoutes: [],
      clientState: {},
    });
  }

  return sessions.get(sessionId);
}

async function upsertSession(userId, sessionId) {
  let s = await ChatSession.findOne({ user: userId, sessionId });

  if (!s) {
    s = await ChatSession.create({
      user: userId,
      sessionId,
      messages: [],
      lastCriteria: {},
    });
  }

  return s;
}

async function saveToDb({ userId, sessionId, userMsg, botMsg, criteria }) {
  try {
    if (!userId || !sessionId) return;

    const chat = await upsertSession(userId, sessionId);

    if (userMsg) chat.messages.push(userMsg);
    if (botMsg) chat.messages.push(botMsg);

    chat.lastCriteria = criteria || {};
    chat.updatedAt = new Date();

    await chat.save();
  } catch (err) {
    console.warn("Voice chat history save failed:", err.message);
  }
}

function saveAudioFile({ buffer, ext }) {
  const file = `${uuidv4()}${ext}`;
  const fullPath = path.join(UPLOAD_DIR, file);

  fs.writeFileSync(fullPath, buffer);

  return `/uploads/voice/${file}`;
}

function extensionFromMime(mime = "") {
  const clean = String(mime).split(";")[0].toLowerCase();

  if (clean.includes("mpeg") || clean.includes("mp3")) return ".mp3";
  if (clean.includes("wav")) return ".wav";
  if (clean.includes("ogg") || clean.includes("oga")) return ".ogg";
  if (clean.includes("webm")) return ".webm";
  if (clean.includes("mp4") || clean.includes("m4a")) return ".m4a";

  return ".mp3";
}

function audioFormatFromMime(mime = "") {
  const clean = String(mime).split(";")[0].toLowerCase();

  if (clean.includes("webm")) return "webm";
  if (clean.includes("mpeg") || clean.includes("mp3")) return "mp3";
  if (clean.includes("wav")) return "wav";
  if (clean.includes("ogg") || clean.includes("oga")) return "ogg";
  if (clean.includes("mp4")) return "mp4";
  if (clean.includes("m4a")) return "m4a";

  return "webm";
}

function audioBase64ToBuffer(audioBase64 = "") {
  const payload = String(audioBase64 || "").includes(",")
    ? String(audioBase64).split(",").pop()
    : String(audioBase64 || "");

  if (!payload) return null;

  try {
    return Buffer.from(payload, "base64");
  } catch {
    return null;
  }
}

function getAuthHeaders(req) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }

  return headers;
}

function getErrorMessage(err) {
  const data = err?.response?.data;

  if (!data) return err.message || "Voice pipeline error";

  if (typeof data === "string") return data;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.message === "string") return data.message;

  if (data.detail?.message) return data.detail.message;

  return JSON.stringify(data);
}

function extractSlots(aiData) {
  return (
    aiData?.slots_normalized ||
    aiData?.slots ||
    aiData?.conversation_state?.slots ||
    {}
  );
}

function normalizeRoute(route, index, slots = {}) {
  const id =
    route?._id ||
    route?.id ||
    route?.routeId ||
    route?.route_id ||
    route?.route_id_str ||
    "";

  return {
    id: String(id),
    _id: String(id),
    routeId: String(id),
    option: Number(route?.option || index + 1),

    operator:
      route?.operator ||
      route?.company ||
      route?.providerName ||
      route?.provider_name ||
      route?.provider ||
      "Bus",

    departureTime:
      route?.departureTime ||
      route?.departure_time ||
      route?.time ||
      "",

    price: route?.price ?? null,
    availableSeats: route?.availableSeats ?? route?.available_seats ?? null,

    travelDate: route?.travelDate || route?.date || slots.date || "",
    fromCity: route?.fromCity || route?.from || slots.from || "",
    toCity: route?.toCity || route?.to || slots.to || "",

    raw: route,
  };
}

function buildRoutesPreview(aiData) {
  const slots = extractSlots(aiData);

  const fullRoutes = Array.isArray(aiData?.data) ? aiData.data : [];
  const previews = Array.isArray(aiData?.routes_preview)
    ? aiData.routes_preview
    : [];

  const source = fullRoutes.length
    ? fullRoutes.slice(0, 3)
    : previews.slice(0, 3);

  return source
    .map((route, index) => normalizeRoute(route, index, slots))
    .filter((route) => route.id || route.operator || route.departureTime);
}

function buildCriteria(aiData, session) {
  const slots = extractSlots(aiData);

  const criteria = {
    from: slots.from || slots.fromCity || "",
    to: slots.to || slots.toCity || "",
    date: slots.date || slots.travelDate || slots.day || "",
    day: slots.day || "",
    ...slots,
  };

  session.clientState = {
    ...session.clientState,
    ...Object.fromEntries(
      Object.entries(criteria).filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
    ),
  };

  return session.clientState;
}

function formatRoutesReply({ slots, routes, fallback }) {
  if (!routes.length) {
    return fallback || "Maaf kijiye, is trip ke liye koi route available nahi.";
  }

  const from = slots?.from || routes[0]?.fromCity || "your city";
  const to = slots?.to || routes[0]?.toCity || "destination";
  const date = slots?.date || routes[0]?.travelDate || "";

  const lines = routes.map((route, index) => {
    const operator = route.operator || "Bus";
    const time = route.departureTime || "Time N/A";
    const price =
      route.price !== null && route.price !== undefined
        ? `Rs ${route.price}`
        : "Price N/A";
    const seats =
      route.availableSeats !== null && route.availableSeats !== undefined
        ? `${route.availableSeats} seats`
        : "Seats N/A";

    return `${index + 1}) ${operator} | Time: ${time} | Price: ${price} | Seats: ${seats}`;
  });

  return `${from} se ${to}${date ? ` (${date})` : ""} ke routes available hain:\n${lines.join(
    "\n"
  )}\n\nAap option 1, 2, ya 3 bol kar bus select kar sakte hain.`;
}

function mapNextAction(aiData, session) {
  const aiAction = aiData?.next_action || aiData?.action || "NONE";
  const state = aiData?.conversation_state || {};
  const slots = extractSlots(aiData);

  const routeChoice = Number(
    state?.route_choice ||
      slots?.route_choice ||
      slots?.routeChoice ||
      aiData?.route_choice ||
      0
  );

  if (routeChoice > 0 && session.lastRoutes[routeChoice - 1]?.id) {
    return {
      nextAction: "OPEN_SEATS",
      selectedRouteId: session.lastRoutes[routeChoice - 1].id,
      selectedRoute: session.lastRoutes[routeChoice - 1],
    };
  }

  if (aiAction === "CALL_GET_ROUTES") {
    return {
      nextAction: "SHOW_ROUTES",
      selectedRouteId: null,
      selectedRoute: null,
    };
  }

  return {
    nextAction: aiAction,
    selectedRouteId: null,
    selectedRoute: null,
  };
}

function buildSelectedRouteReply(selectedRoute) {
  if (!selectedRoute) {
    return "Theek hai. Bus select ho gayi. Ab seats select karein.";
  }

  const operator = selectedRoute.operator || "Bus";
  const time = selectedRoute.departureTime || "";

  return `Theek hai. ${operator}${time ? ` ki ${time} wali` : ""} bus select ho gayi. Ab seats select karein.`;
}

async function callVoiceApi({ req, sid, audioBase64, audioFormat, context }) {
  const payload = {
    session_id: sid,
    audio_base64: audioBase64,
    audio_format: audioFormat,
    response_mode: "both",
    context,
  };

  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/voice/chat`,
      payload,
      {
        headers: getAuthHeaders(req),
        timeout: AI_SERVICE_TIMEOUT_MS,
      }
    );

    return response.data || {};
  } catch (err) {
    // Fallback if your FastAPI exposes /voice/chat instead of /api/voice/chat
    if (err?.response?.status === 404) {
      const response = await axios.post(`${AI_SERVICE_URL}/voice/chat`, payload, {
        headers: getAuthHeaders(req),
        timeout: AI_SERVICE_TIMEOUT_MS,
      });

      return response.data || {};
    }

    throw err;
  }
}

exports.voiceChat = async (req, res) => {
  try {
    const sid = req.body?.sessionId ? String(req.body.sessionId) : uuidv4();
    const session = getSession(sid);
    const userId = req.user?._id || null;

    if (!userId) {
      return res.status(401).json({
        message: "Not authorized.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Audio required. Field name must be audio.",
      });
    }

    if (!req.file.buffer || req.file.buffer.length < 1000) {
      return res.status(400).json({
        message: "Audio too small or empty. Frontend recorder may be sending silence.",
        size: req.file.buffer ? req.file.buffer.length : 0,
      });
    }

    const savedUserAudioUrl = saveAudioFile({
      buffer: req.file.buffer,
      ext: extensionFromMime(req.file.mimetype || "audio/webm"),
    });

    const aiData = await callVoiceApi({
      req,
      sid,
      audioBase64: req.file.buffer.toString("base64"),
      audioFormat: audioFormatFromMime(req.file.mimetype || "audio/webm"),
      context: {
        conversation_state: session.conversationState,
      },
    });

    if (aiData.conversation_state) {
      session.conversationState = aiData.conversation_state;
    }

    const criteria = buildCriteria(aiData, session);
    const newRoutesPreview = buildRoutesPreview(aiData);

    if (newRoutesPreview.length) {
      session.lastRoutes = newRoutesPreview;
    }

    const routesPreview = newRoutesPreview.length
      ? newRoutesPreview
      : session.lastRoutes;

    const mappedAction = mapNextAction(aiData, session);

    let replyText =
      aiData.reply_text ||
      aiData.response ||
      aiData.message ||
      "OK";

    if (mappedAction.nextAction === "OPEN_SEATS") {
      replyText = buildSelectedRouteReply(mappedAction.selectedRoute);
    }

    const audioMime = aiData.audio_mime_type || aiData.audioMime || "audio/mpeg";
    const botAudioBuffer = audioBase64ToBuffer(
      aiData.audio_base64 || aiData.audioBase64 || aiData.audio
    );

    let savedBotAudioUrl = null;

    if (botAudioBuffer?.length) {
      savedBotAudioUrl = saveAudioFile({
        buffer: botAudioBuffer,
        ext: extensionFromMime(audioMime),
      });
    }

    await saveToDb({
      userId,
      sessionId: sid,
      userMsg: {
        sender: "user",
        type: "voice",
        text: aiData.user_text || aiData.userText || "",
        audioUrl: savedUserAudioUrl,
      },
      botMsg: {
        sender: "bot",
        type: "text",
        text: replyText,
        audioUrl: savedBotAudioUrl,
      },
      criteria,
    });

    return res.json({
      sessionId: sid,

      userText: aiData.user_text || aiData.userText || "",
      replyText,

      criteria,
      routesPreview,

      selectedRouteId: mappedAction.selectedRouteId,
      nextAction: mappedAction.nextAction,

      audioBase64: aiData.audio_base64 || aiData.audioBase64 || aiData.audio || null,
      audioMime,

      savedUserAudioUrl,
      savedBotAudioUrl,

      debug: {
        aiServiceUrl: AI_SERVICE_URL,
        aiNextAction: aiData.next_action || aiData.action,
        intent: aiData.intent,
        intentConfidence: aiData.intent_confidence || aiData.confidence,
        slotsRaw: aiData.slots_raw,
        slotsNormalized: aiData.slots_normalized || aiData.slots,
        pipelineMeta: aiData.pipeline_meta || {},
        conversationState: aiData.conversation_state || {},
      },
    });
  } catch (err) {
    const message = getErrorMessage(err);

    console.error("Voice pipeline error:", message);

    return res.status(err?.response?.status || 500).json({
      message,
    });
  }
};
