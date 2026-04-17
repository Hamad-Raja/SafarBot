// Example: Node/Express route calls FastAPI AI service
const axios = require("axios");
const FormData = require("form-data");

// TEXT -> intent
async function understandText(text, sessionId) {
  const { data } = await axios.post("http://127.0.0.1:8000/intent", {
    text,
    session_id: sessionId || null
  });
  return data;
}

// VOICE -> stt + intent
async function understandVoice(buffer, filename, sessionId) {
  const fd = new FormData();
  fd.append("audio", buffer, { filename: filename || "audio.webm" });

  const { data } = await axios.post("http://127.0.0.1:8000/voice/understand", fd, {
    headers: fd.getHeaders(),
    params: sessionId ? { session_id: sessionId } : {}
  });
  return data;
}

module.exports = { understandText, understandVoice };
