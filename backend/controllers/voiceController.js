// backend/controllers/voiceController.js
const axios = require("axios");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const Route = require("../models/RouteM.js");
const ChatSession = require("../models/ChatSession");

const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

// ✅ uploads folder (served by express static)
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "voice");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// In-memory sessions (dev). For production: Redis.
const sessions = new Map();
function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      clientState: {},
      lastRoutes: [],
      awaitingSelection: false,
    });
  }
  return sessions.get(sessionId);
}

// ✅ DB session helpers
async function upsertSession(userId, sessionId) {
  let s = await ChatSession.findOne({ user: userId, sessionId });
  if (!s) s = await ChatSession.create({ user: userId, sessionId, messages: [] });
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
  } catch {
    // ignore db errors (don’t break flow)
  }
}

// -----------------------------
// Helpers (NO rapidfuzz)
// -----------------------------
function normalizeStr(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s:]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function simpleSimilarity(a, b) {
  a = normalizeStr(a);
  b = normalizeStr(b);
  if (!a || !b) return 0;

  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 85;

  const aw = new Set(a.split(" ").filter(Boolean));
  const bw = new Set(b.split(" ").filter(Boolean));

  let hit = 0;
  for (const w of aw) if (bw.has(w)) hit++;

  return Math.round((hit / Math.max(aw.size, bw.size)) * 100);
}

function pickOptionNumber(text) {
  const t = normalizeStr(text);

  const m = t.match(/\b([1-3])\b/);
  if (m) return parseInt(m[1], 10);

  if (t.includes("one") || t.includes("first")) return 1;
  if (t.includes("two") || t.includes("second")) return 2;
  if (t.includes("three") || t.includes("third")) return 3;

  if (t.includes("aik") || t.includes("ek") || t.includes("option aik") || t.includes("apشن aik"))
    return 1;
  if (t.includes("do") || t.includes("option do")) return 2;
  if (t.includes("teen") || t.includes("tin") || t.includes("option teen")) return 3;

  if (t.includes("ایک") || t.includes("اک") || t.includes("پہلا") || t.includes("اول")) return 1;
  if (t.includes("دو") || t.includes("دوسرا")) return 2;
  if (t.includes("تین") || t.includes("تیسرا")) return 3;

  if (t.includes("آپشن") || t.includes("اپشن") || t.includes("آبشن") || t.includes("ابشن")) {
    if (t.includes("اک") || t.includes("ایک")) return 1;
    if (t.includes("دو")) return 2;
    if (t.includes("تین")) return 3;
  }

  return null;
}

function extractTimeHint(text) {
  const t = normalizeStr(text);
  const m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|بجے)?\b/);
  if (!m) return null;

  let hh = parseInt(m[1], 10);
  let mm = m[2] ? parseInt(m[2], 10) : 0;
  const suffix = (m[3] || "").toLowerCase();

  if (hh < 1 || hh > 12) return null;
  if (mm < 0 || mm > 59) mm = 0;

  if (suffix === "pm" && hh !== 12) hh += 12;
  if (suffix === "am" && hh === 12) hh = 0;

  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function time24To12(t24) {
  if (!t24) return null;
  const m = String(t24).match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  if (hh === 0) hh = 12;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function extractProviderHint(text) {
  const t = normalizeStr(text);

  if (
    t.includes("hamad") ||
    t.includes("حماد") ||
    t.includes("ہماد") ||
    t.includes("ہمد") ||
    t.includes("ہماڈ") ||
    t.includes("ہامد")
  )
    return "Hamad";

  if (t.includes("faisal") || t.includes("فیصل")) return "Faisal Movers";
  if (t.includes("daewoo") || t.includes("داوو") || t.includes("دی وو")) return "Daewoo";
  if (t.includes("skyways") || t.includes("sky way") || t.includes("سکائی")) return "Skyways";
  if (t.includes("niazi") || t.includes("نیازی")) return "Niazi Express";
  if (t.includes("baloch") || t.includes("بلوچ")) return "Baloch Transport";

  return null;
}

function fuzzyPickOperator(text, lastRoutes) {
  const t = normalizeStr(text);
  let best = null;
  let bestScore = 0;

  for (const r of lastRoutes || []) {
    const op = normalizeStr(r.operator);
    if (!op) continue;

    const score = simpleSimilarity(t, op);
    if (score > bestScore) {
      bestScore = score;
      best = r.operator;
    }
  }

  if (bestScore >= 60) return best;
  return null;
}

// Call FastAPI TTS -> returns buffer + mime
async function ttsAudio(text) {
  const r = await axios.post(`${FASTAPI_URL}/tts`, { text }, { responseType: "arraybuffer", timeout: 120000 });
  const mime = r.headers?.["content-type"] || "application/octet-stream";
  return { buf: Buffer.from(r.data), mime };
}

function buildRoutesPreview(routes) {
  return routes.slice(0, 3).map((r) => ({
    id: r._id.toString(),
    operator: r.operator || "",
    departureTime: r.departureTime || "",
    price: r.price ?? null,
    availableSeats: r.availableSeats ?? null,
    travelDate: r.travelDate || "",
    fromCity: r.fromCity,
    toCity: r.toCity,
  }));
}

function formatRoutesReply({ from, to, date, routes }) {
  if (!routes || routes.length === 0) {
    const d = date ? ` (${date})` : "";
    return `Maaf kijiye, ${from} se ${to}${d} ke liye koi route available nahi.`;
  }

  const top = routes.slice(0, 3);
  const d = date ? ` (${date})` : "";

  const lines = top.map((r, i) => {
    const operator = r.operator || "NA";
    const time = r.departureTime || "NA";
    const price = r.price ?? "NA";
    const seats = r.availableSeats ?? "NA";
    return `${i + 1}) ${operator} | Time: ${time} | Price: ${price} | Seats: ${seats}`;
  });

  return `${from} se ${to}${d} ke routes available hain:\n${lines.join(
    "\n"
  )}\n\nAap kon si bus book karna chahte hain? (Option select karne ke liye, aap bol sakte hain: 'option 1 , 2, 3' etc.)`;
}

function pickRouteByProviderTime(lastRoutes, providerHint, timeHint24) {
  if (!lastRoutes?.length) return null;

  const providerNorm = providerHint ? providerHint.toLowerCase() : null;
  const time12 = timeHint24 ? time24To12(timeHint24) : null;

  if (providerNorm && time12) {
    const hit = lastRoutes.find((r) => {
      const op = String(r.operator || "").toLowerCase();
      const dep = String(r.departureTime || "").toLowerCase();
      return op.includes(providerNorm.split(" ")[0]) && dep.includes(time12.toLowerCase().slice(0, 5));
    });
    if (hit) return hit;
  }

  if (providerNorm) {
    const hit = lastRoutes.find((r) => String(r.operator || "").toLowerCase().includes(providerNorm.split(" ")[0]));
    if (hit) return hit;
  }

  if (time12) {
    const hit = lastRoutes.find((r) =>
      String(r.departureTime || "").toLowerCase().includes(time12.toLowerCase().slice(0, 5))
    );
    if (hit) return hit;
  }

  return null;
}

async function findRoutes({ from, to, date }) {
  const q = {
    active: true,
    fromCity: new RegExp(`^${from}$`, "i"),
    toCity: new RegExp(`^${to}$`, "i"),
  };
  if (date) q.travelDate = date;
  return Route.find(q).sort({ departureTime: 1 }).limit(10);
}

// ✅ Save buffers to disk and return public url
function saveAudioFile({ buffer, ext }) {
  const file = `${uuidv4()}${ext}`;
  const full = path.join(UPLOAD_DIR, file);
  fs.writeFileSync(full, buffer);
  return `/uploads/voice/${file}`;
}

// -----------------------------
// Controller
// -----------------------------
exports.voiceChat = async (req, res) => {
  try {
    const sid = req.body?.sessionId ? String(req.body.sessionId) : uuidv4();
    const sess = getSession(sid);

    const userId = req.user?._id || null;
    if (!userId) return res.status(401).json({ message: "Not authorized." });

    if (!req.file) return res.status(400).json({ message: "Audio required (field: audio)" });

    if (!req.file.buffer || req.file.buffer.length < 2000) {
      return res.status(400).json({
        message: "Audio too small/empty. Frontend recorder may be sending silence.",
        size: req.file.buffer ? req.file.buffer.length : 0,
      });
    }

    // ✅ Save USER VOICE (webm) to disk
    const savedUserAudioUrl = saveAudioFile({ buffer: req.file.buffer, ext: ".webm" });

    // 1) Send audio to FastAPI STT + slots
    const form = new FormData();
    form.append("audio", req.file.buffer, {
      filename: req.file.originalname || "voice.webm",
      contentType: req.file.mimetype || "audio/webm",
      knownLength: req.file.buffer.length,
    });

    const headers = {
      ...form.getHeaders(),
      ...(await new Promise((resolve) => {
        form.getLength((err, length) => (err ? resolve({}) : resolve({ "Content-Length": length })));
      })),
    };

    const sttRes = await axios.post(
      `${FASTAPI_URL}/voice/understand?session_id=${encodeURIComponent(sid)}`,
      form,
      { headers, timeout: 120000 }
    );

    const userText = sttRes.data?.text || "";
    const slots = sttRes.data?.slots || {};
    const debug = sttRes.data?.debug || {};

    // 2) If STT empty
    if (!userText.trim()) {
      const replyText =
        debug?.stt_ready === false
          ? "STT service ready nahi hai. Please server setup check karein."
          : "Aapki awaaz clear nahi hui. Please dobara boliye: 'Islamabad se Lahore jana hai'.";

      let audio = null;
      try {
        audio = await ttsAudio(replyText);
      } catch {}

      // ✅ Save BOT VOICE too (if exists)
      let savedBotAudioUrl = null;
      if (audio?.buf?.length) {
        savedBotAudioUrl = saveAudioFile({ buffer: audio.buf, ext: ".mp3" });
      }

      await saveToDb({
        userId,
        sessionId: sid,
        userMsg: {
          sender: "user",
          type: "voice",
          text: userText || "",
          audioUrl: savedUserAudioUrl,
        },
        botMsg: {
          sender: "bot",
          type: "text",
          text: replyText,
          audioUrl: savedBotAudioUrl,
        },
        criteria: sess.clientState,
      });

      return res.json({
        sessionId: sid,
        userText: null,
        replyText,
        criteria: sess.clientState,
        routesPreview: [],
        selectedRouteId: null,
        nextAction: "REPEAT",
        // keep old behavior too
        audioBase64: audio ? audio.buf.toString("base64") : null,
        audioMime: audio ? audio.mime : null,
        // ✅ NEW urls for replay
        savedUserAudioUrl,
        savedBotAudioUrl,
      });
    }

    // 3) Merge slots into session state
    sess.clientState = { ...sess.clientState, ...slots };

    const from = sess.clientState.from || sess.clientState.fromCity || null;
    const to = sess.clientState.to || sess.clientState.toCity || null;
    const date = sess.clientState.date || sess.clientState.travelDate || null;

    // 4) Selection signals
    const opt = pickOptionNumber(userText);
    const providerHint = extractProviderHint(userText) || fuzzyPickOperator(userText, sess.lastRoutes);
    const timeHint24 = extractTimeHint(userText);

    let replyText = "";
    let routesPreview = [];
    let selectedRouteId = null;
    let nextAction = "NONE";

    const userTriedToSelect = Boolean(opt || providerHint || timeHint24);

    if (opt && sess.lastRoutes.length >= opt) {
      const picked = sess.lastRoutes[opt - 1];
      selectedRouteId = picked.id;
      sess.clientState.selectedRouteId = picked.id;

      sess.awaitingSelection = false;

      replyText = `Theek hai. ${picked.operator} ki ${picked.departureTime} wali bus select ho gayi. Ab seats select karein.`;
      nextAction = "OPEN_SEATS";
    } else {
      const picked = pickRouteByProviderTime(sess.lastRoutes, providerHint, timeHint24);
      if (picked) {
        selectedRouteId = picked.id;
        sess.clientState.selectedRouteId = picked.id;

        sess.awaitingSelection = false;

        replyText = `Theek hai. ${picked.operator} ki ${picked.departureTime} wali bus select ho gayi. Ab seats select karein.`;
        nextAction = "OPEN_SEATS";
      }
    }

    if (!selectedRouteId) {
      if (sess.awaitingSelection && sess.lastRoutes.length > 0) {
        if (userTriedToSelect) {
          replyText =
            "Maaf kijiye, mujhe aap ka option samajh nahi aaya. Please dobara bol dein (jaise: 'option aik' ya 'Hamad 9 baje wali').";
          nextAction = "REPEAT_SELECTION";
        } else {
          replyText = "Aap kon si bus book karna chahte hain?";
          nextAction = "ASK_SELECTION";
        }
        routesPreview = sess.lastRoutes;
      } else {
        if (!from) {
          replyText = "Aap kahan se travel karna chahte hain? (from city)";
          nextAction = "ASK_FROM";
        } else if (!to) {
          replyText = "Aap kahan jana chahte hain? (to city)";
          nextAction = "ASK_TO";
        } else {
          const routes = await findRoutes({ from, to, date });

          const top3 = buildRoutesPreview(routes);
          sess.lastRoutes = top3;
          sess.awaitingSelection = top3.length > 0;

          routesPreview = top3;

          replyText = formatRoutesReply({ from, to, date, routes });
          nextAction = "SHOW_ROUTES";
        }
      }
    }

    // 5) TTS
    let audio = null;
    try {
      audio = await ttsAudio(replyText);
    } catch {}

    let savedBotAudioUrl = null;
    if (audio?.buf?.length) {
      savedBotAudioUrl = saveAudioFile({ buffer: audio.buf, ext: ".mp3" });
    }

    // ✅ Save both messages to DB
    await saveToDb({
      userId,
      sessionId: sid,
      userMsg: {
        sender: "user",
        type: "voice",
        text: userText,
        audioUrl: savedUserAudioUrl,
      },
      botMsg: {
        sender: "bot",
        type: "text",
        text: replyText,
        audioUrl: savedBotAudioUrl,
      },
      criteria: sess.clientState,
    });

    return res.json({
      sessionId: sid,
      userText,
      replyText,
      criteria: sess.clientState,
      routesPreview,
      selectedRouteId,
      nextAction,
      // keep old behavior too
      audioBase64: audio ? audio.buf.toString("base64") : null,
      audioMime: audio ? audio.mime : null,
      debug,
      // ✅ NEW urls for replay
      savedUserAudioUrl,
      savedBotAudioUrl,
    });
  } catch (err) {
    return res.status(500).json({
      message: err?.response?.data || err.message || "Voice pipeline error",
    });
  }
};