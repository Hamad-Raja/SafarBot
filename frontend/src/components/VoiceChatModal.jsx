import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const VoiceChatModal = ({ open, onClose, onCriteria }) => {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const listRef = useRef(null);

  // Backend origin for /uploads voice files
  const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

  const resolveMediaUrl = (u) => {
    if (!u) return null;
    if (u.startsWith("blob:")) return u;
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return `${API_ORIGIN}${u.startsWith("/") ? "" : "/"}${u}`;
  };

  const pushMsg = (m) => setMessages((prev) => [...prev, m]);

  const updateMsg = (id, patch) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  };

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const res = await axios.get("/api/chat-history/latest", {
          withCredentials: true,
          timeout: 60000,
        });

        setSessionId(res.data?.sessionId || null);

        const serverMsgs = Array.isArray(res.data?.messages)
          ? res.data.messages
          : [];

        setMessages(
          serverMsgs.map((m) => ({
            id: m._id || `${Date.now()}_${Math.random()}`,
            sender: m.sender,
            type: m.type,
            text: m.text || "",
            audioUrl: resolveMediaUrl(m.audioUrl || null),
          }))
        );

        if (res.data?.lastCriteria) onCriteria?.(res.data.lastCriteria);
      } catch {
        setMessages([]);
        setSessionId(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setTimeout(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  if (!open) return null;

  const playAudioUrl = async (url) => {
    try {
      if (!url) return;
      const a = new Audio(url);
      await a.play();
    } catch {
      // Browser may block autoplay. User can replay from controls.
    }
  };

  const base64ToBlobUrl = (b64, mime = "audio/mpeg") => {
    const cleanBase64 = String(b64).includes(",")
      ? String(b64).split(",").pop()
      : String(b64);

    const byteChars = atob(cleanBase64);
    const byteNumbers = new Array(byteChars.length);

    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }

    const blob = new Blob([new Uint8Array(byteNumbers)], { type: mime });
    return URL.createObjectURL(blob);
  };

  const handleNextAction = (data) => {
    const nextAction = data?.nextAction;
    const routeId = data?.selectedRouteId;
    const c = data?.criteria || {};

    if (nextAction === "OPEN_SEATS" && routeId) {
      onClose?.();
      navigate("/seats", { state: { routeId } });
      return true;
    }

    if (nextAction === "OPEN_ROUTES" || nextAction === "SHOW_ROUTES") {
      const qs = new URLSearchParams({
        from: c.from || "",
        to: c.to || "",
        date: c.date || c.day || "",
      }).toString();

      onClose?.();
      navigate(`/routes?${qs}`);
      return true;
    }

    return false;
  };

  const clearChat = async () => {
    if (processing) return;

    const ok = window.confirm("Clear chat history?");
    if (!ok) return;

    try {
      if (sessionId) {
        await axios.delete(`/api/chat-history/session/${sessionId}`, {
          withCredentials: true,
          timeout: 60000,
        });
      }

      setMessages([]);
      setSessionId(null);
      toast.success("Chat cleared.");
    } catch {
      toast.error("Failed to clear chat.");
    }
  };

  const sendText = async () => {
    const t = text.trim();
    if (!t || processing) return;

    setText("");
    pushMsg({
      id: Date.now(),
      sender: "user",
      type: "text",
      text: t,
    });

    try {
      setProcessing(true);

      const res = await axios.post(
        "/api/chat/message",
        { sessionId, message: t },
        { withCredentials: true, timeout: 180000 }
      );

      if (res.data?.sessionId) setSessionId(res.data.sessionId);

      const replyText = res.data?.replyText || "OK";

      pushMsg({
        id: Date.now() + 1,
        sender: "bot",
        type: "text",
        text: replyText,
      });

      if (res.data?.criteria) onCriteria?.(res.data.criteria);

      handleNextAction(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send message.");
    } finally {
      setProcessing(false);
    }
  };

  const startRecording = async () => {
    if (processing || recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const mr = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );

      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });

        chunksRef.current = [];

        if (blob.size < 1000) {
          toast.error("Recording was too short or empty.");
          return;
        }

        await sendVoiceBlob(blob);
      };

      mr.start();
      setRecording(true);
    } catch {
      toast.error("Mic permission denied or not available.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    try {
      mediaRecorderRef.current.stop();
    } finally {
      setRecording(false);
    }
  };

  const sendVoiceBlob = async (blob) => {
    try {
      setProcessing(true);

      const localUrl = URL.createObjectURL(blob);
      const userVoiceMsgId = Date.now();

      pushMsg({
        id: userVoiceMsgId,
        sender: "user",
        type: "voice",
        audioUrl: localUrl,
      });

      const fd = new FormData();
      fd.append("audio", blob, "voice.webm");

      if (sessionId) {
        fd.append("sessionId", sessionId);
      }

      const res = await axios.post("/api/voice/chat", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
        timeout: 180000,
      });

      if (res.data?.sessionId) setSessionId(res.data.sessionId);

      const userText = res.data?.userText || null;
      const replyText = res.data?.replyText || "OK";

      if (res.data?.savedUserAudioUrl) {
        updateMsg(userVoiceMsgId, {
          audioUrl: resolveMediaUrl(res.data.savedUserAudioUrl),
        });
      }

      if (userText) {
        pushMsg({
          id: Date.now() + 1,
          sender: "user",
          type: "text",
          text: userText,
        });
      }

      let botAudioUrl = res.data?.savedBotAudioUrl
        ? resolveMediaUrl(res.data.savedBotAudioUrl)
        : null;

      if (!botAudioUrl) {
        const audioBase64 = res.data?.audioBase64 || null;
        const audioMime = res.data?.audioMime || "audio/mpeg";
        botAudioUrl = audioBase64
          ? base64ToBlobUrl(audioBase64, audioMime)
          : null;
      }

      pushMsg({
        id: Date.now() + 2,
        sender: "bot",
        type: "text",
        text: replyText,
        audioUrl: botAudioUrl,
      });

      if (res.data?.criteria) onCriteria?.(res.data.criteria);

      const navigated = handleNextAction(res.data);
      if (navigated) return;

      if (botAudioUrl) {
        await playAudioUrl(botAudioUrl);
      } else {
        toast.error("Backend did not return voice audio.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Voice request failed.");
    } finally {
      setProcessing(false);
    }
  };

  const Bubble = ({ m }) => {
    const isUser = m.sender === "user";

    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs border ${
            isUser
              ? "bg-cyan-500/15 border-cyan-400/25 text-slate-100"
              : "bg-slate-900/70 border-white/10 text-slate-100"
          }`}
        >
          {m.type === "text" && (
            <div className="whitespace-pre-wrap">{m.text}</div>
          )}

          {m.type === "voice" && m.audioUrl && (
            <audio controls src={m.audioUrl} className="w-56" />
          )}

          {m.type === "text" && m.sender === "bot" && m.audioUrl && (
            <div className="mt-2">
              <audio controls src={m.audioUrl} className="w-56" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !processing && onClose?.()}
      />

      <div className="relative w-full max-w-2xl rounded-3xl border border-cyan-500/30 bg-slate-900 shadow-2xl shadow-cyan-500/20 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/40">
          <div>
            <h2 className="text-sm md:text-base font-extrabold text-white">
              SafarBot Voice Assistant
            </h2>
            <p className="text-[11px] text-slate-400">
              Text → text reply. Voice → voice reply.{" "}
              {processing ? "Processing..." : "Ready"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearChat}
              disabled={processing}
              className="h-9 px-3 rounded-2xl bg-slate-800 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700 transition text-xs"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => !processing && onClose?.()}
              className="h-9 w-9 rounded-2xl bg-slate-800 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              ✕
            </button>
          </div>
        </div>

        <div
          ref={listRef}
          className="h-[55vh] md:h-[60vh] overflow-y-auto p-4 space-y-3"
        >
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 text-xs mt-8">
              Try voice: “Islamabad se Lahore kal”
            </div>
          ) : (
            messages.map((m) => <Bubble key={m.id} m={m} />)
          )}

          {processing && (
            <div className="text-center text-[11px] text-slate-400">
              SafarBot is thinking...
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-slate-950/40">
          <div className="flex gap-2 items-center">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder="Type your message..."
              className="flex-1 rounded-2xl bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
              disabled={processing}
            />

            <button
              type="button"
              onClick={sendText}
              disabled={processing}
              className="px-4 py-2 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/25 transition text-sm"
            >
              Send
            </button>

            {!recording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={processing}
                className="px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/25 transition text-sm"
              >
                🎙
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="px-4 py-2 rounded-2xl bg-red-500/15 border border-red-400/30 text-red-200 hover:bg-red-500/25 transition text-sm"
              >
                ⏹ Stop
              </button>
            )}
          </div>

          <p className="mt-2 text-[10px] text-slate-500">
            Voice is sent as{" "}
            <span className="text-slate-300">audio/webm</span>. Voice replies
            are returned by backend TTS and can be replayed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatModal;