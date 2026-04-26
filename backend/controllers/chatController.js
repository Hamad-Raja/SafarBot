const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const ChatSession = require("../models/ChatSession");

const AI_SERVICE_URL = (
  process.env.AI_SERVICE_URL ||
  process.env.FASTAPI_URL ||
  "https://eshanelahi0-safarbot-voice-api.hf.space"
).replace(/\/$/, "");

const AI_SERVICE_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS || 180000);

// Node-side memory: helps map option 1/2/3 to real MongoDB route _id
const sessions = new Map();

function getLocalSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      conversationState: null,
      lastRoutes: [],
      clientState: {},
    });
  }

  return sessions.get(sessionId);
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

async function upsertChatSession(userId, sessionId) {
  let chat = await ChatSession.findOne({ user: userId, sessionId });

  if (!chat) {
    chat = await ChatSession.create({
      user: userId,
      sessionId,
      messages: [],
      lastCriteria: {},
    });
  }

  return chat;
}

async function saveChatHistory({ req, sessionId, userText, replyText, criteria }) {
  try {
    const userId = req.user?._id;
    if (!userId) return;

    const chat = await upsertChatSession(userId, sessionId);

    chat.messages.push({
      sender: "user",
      type: "text",
      text: userText,
    });

    chat.messages.push({
      sender: "bot",
      type: "text",
      text: replyText,
    });

    chat.lastCriteria = criteria || {};
    chat.updatedAt = new Date();

    await chat.save();
  } catch (err) {
    console.warn("Text chat history save failed:", err.message);
  }
}

function extractSlots(aiData) {
  return aiData?.slots || aiData?.slots_normalized || {};
}

function buildCriteria(aiData, localSession) {
  const slots = extractSlots(aiData);

  const criteria = {
    from: slots.from || slots.fromCity || "",
    to: slots.to || slots.toCity || "",
    date: slots.date || slots.travelDate || slots.day || "",
    day: slots.day || "",
    ...slots,
  };

  localSession.clientState = {
    ...localSession.clientState,
    ...Object.fromEntries(
      Object.entries(criteria).filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
    ),
  };

  return localSession.clientState;
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
      route?.provider ||
      route?.company ||
      route?.providerName ||
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

  const source = Array.isArray(aiData?.data)
    ? aiData.data.slice(0, 3)
    : Array.isArray(aiData?.routes_preview)
    ? aiData.routes_preview.slice(0, 3)
    : [];

  return source
    .map((route, index) => normalizeRoute(route, index, slots))
    .filter((route) => route.id || route.operator || route.departureTime);
}

function formatRoutesReply({ routes, criteria, fallback }) {
  if (!routes.length) {
    return fallback || "Maaf kijiye, is trip ke liye koi route available nahi.";
  }

  const from = criteria.from || routes[0]?.fromCity || "your city";
  const to = criteria.to || routes[0]?.toCity || "destination";
  const date = criteria.date || routes[0]?.travelDate || "";

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

    return `${index + 1}) ${operator} — ${time} — ${price} (${seats})`;
  });

  return (
    `${from} se ${to}${date ? ` (${date})` : ""} ke routes available hain:\n` +
    `${lines.join("\n")}\n` +
    `Konsi route book karni hai? Option 1, 2, ya 3 batayein.`
  );
}

function buildSelectedRouteReply(selectedRoute) {
  if (!selectedRoute) {
    return "Theek hai. Bus select ho gayi. Ab seats select karein.";
  }

  const operator = selectedRoute.operator || "Bus";
  const time = selectedRoute.departureTime || "";

  return `Theek hai. ${operator}${time ? ` ki ${time} wali` : ""} bus select ho gayi. Ab seats select karein.`;
}

function mapNextAction(aiData, localSession) {
  const conversationState = aiData?.conversation_state || {};
  const slots = extractSlots(aiData);

  const routeChoice = Number(
    conversationState.route_choice ||
      slots.route_choice ||
      slots.routeChoice ||
      0
  );

  if (routeChoice > 0 && localSession.lastRoutes[routeChoice - 1]?.id) {
    return {
      nextAction: "OPEN_SEATS",
      selectedRouteId: localSession.lastRoutes[routeChoice - 1].id,
      selectedRoute: localSession.lastRoutes[routeChoice - 1],
    };
  }

  return {
    nextAction: aiData?.action || aiData?.next_action || "NONE",
    selectedRouteId: null,
    selectedRoute: null,
  };
}

exports.chatMessage = async (req, res) => {
  try {
    const { sessionId, message, text } = req.body || {};
    const userMsg = String(message || text || "").trim();

    if (!userMsg) {
      return res.status(400).json({ message: "Message is required." });
    }

    const sid = sessionId ? String(sessionId) : uuidv4();
    const localSession = getLocalSession(sid);

    const aiRes = await axios.post(
      `${AI_SERVICE_URL}/chat`,
      {
        text: userMsg,
        session_id: sid,
        context: {
          conversation_state: localSession.conversationState,
        },
      },
      {
        headers: getAuthHeaders(req),
        timeout: AI_SERVICE_TIMEOUT_MS,
      }
    );

    const aiData = aiRes.data || {};

    if (aiData.conversation_state) {
      localSession.conversationState = aiData.conversation_state;
    }

    const criteria = buildCriteria(aiData, localSession);
    const newRoutesPreview = buildRoutesPreview(aiData);

    if (newRoutesPreview.length) {
      localSession.lastRoutes = newRoutesPreview;
    }

    const mappedAction = mapNextAction(aiData, localSession);

    let replyText = aiData.response || aiData.reply_text || "OK";

    if (
      (aiData.action === "CALL_GET_ROUTES" || newRoutesPreview.length) &&
      newRoutesPreview.length
    ) {
      replyText = formatRoutesReply({
        routes: newRoutesPreview,
        criteria,
        fallback: replyText,
      });
    }

    if (mappedAction.nextAction === "OPEN_SEATS") {
      replyText = buildSelectedRouteReply(mappedAction.selectedRoute);
    }

    await saveChatHistory({
      req,
      sessionId: sid,
      userText: aiData.user_text || userMsg,
      replyText,
      criteria,
    });

    return res.json({
      sessionId: sid,
      userText: aiData.user_text || userMsg,
      replyText,
      criteria,

      routesPreview: newRoutesPreview.length
        ? newRoutesPreview
        : localSession.lastRoutes,

      selectedRouteId: mappedAction.selectedRouteId,
      nextAction: mappedAction.nextAction,

      audioBase64: aiData.audio_base64 || null,
      audioMime: aiData.audio_mime_type || null,
      audioUrl: null,

      debug: {
        aiServiceUrl: AI_SERVICE_URL,
        action: aiData.action,
        intent: aiData.intent,
        confidence: aiData.confidence,
        slots: aiData.slots,
        slotsRaw: aiData.slots_raw,
        type: aiData.type,
        pipelineMeta: aiData.pipeline_meta || {},
        conversationState: aiData.conversation_state || {},
      },
    });
  } catch (err) {
    const upstream = err?.response?.data;
    console.error("Text chat pipeline error:", upstream || err.message);

    return res.status(err?.response?.status || 500).json({
      message:
        upstream?.detail?.message ||
        upstream?.detail ||
        upstream?.message ||
        err.message ||
        "AI error",
    });
  }
};