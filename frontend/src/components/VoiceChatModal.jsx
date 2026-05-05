import React, { useEffect, useRef, useState } from "react";
import Api from '../api/api';
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Mic2, Send, Square, X } from "lucide-react";

const VoiceChatModal = ({ open, onClose, onCriteria }) => {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [responsePlaying, setResponsePlaying] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const listRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationRef = useRef(null);

  // Backend origin for /uploads voice files
  const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

  const resolveMediaUrl = (u) => {
    if (!u) return null;
    if (u.startsWith("blob:")) return u;
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return `${API_ORIGIN}${u.startsWith("/") ? "" : "/"}${u}`;
  };

  const cleanupVoiceMeter = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setVoiceLevel(0);
  };

  const startVoiceMeter = (stream) => {
    cleanupVoiceMeter();

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 256;
    source.connect(analyser);
    audioContextRef.current = audioContext;

    const data = new Uint8Array(analyser.fftSize);

    const tick = () => {
      analyser.getByteTimeDomainData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const centered = data[i] - 128;
        sum += centered * centered;
      }

      const rms = Math.sqrt(sum / data.length);
      setVoiceLevel(rms > 3 ? Math.min(1, rms / 24) : 0);
      animationRef.current = requestAnimationFrame(tick);
    };

    tick();
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
        const res = await Api.get("/api/chat-history/latest", {
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

  useEffect(() => {
    if (open) return;

    cleanupVoiceMeter();
    setRecording(false);
    setProcessing(false);
    setResponsePlaying(false);
  }, [open]);

  if (!open) return null;

  const playAudioUrl = async (url) => {
    try {
      if (!url) return;
      const a = new Audio(url);
      a.onplay = () => setResponsePlaying(true);
      a.onended = () => setResponsePlaying(false);
      a.onpause = () => setResponsePlaying(false);
      a.onerror = () => setResponsePlaying(false);
      await a.play();
    } catch {
      setResponsePlaying(false);
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
        await Api.delete(`/api/chat-history/session/${sessionId}`, {
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

      const res = await Api.post(
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
      startVoiceMeter(stream);

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
        cleanupVoiceMeter();

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
      cleanupVoiceMeter();
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

      const res = await Api.post("/api/voice/chat", fd, {
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

  const VoiceGrains = () => {
    const active = recording || responsePlaying;
    const liveLevel = responsePlaying ? 0.82 : voiceLevel;
    const visible = active && liveLevel > 0.02;
    const dots = Array.from({ length: 18 });

    return (
      <div
        className={`pointer-events-none absolute left-1/2 top-20 flex -translate-x-1/2 items-center justify-center gap-1.5 transition-all duration-300 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        aria-hidden="true"
      >
        {dots.map((_, index) => {
          const wave = Math.sin(index * 0.9 + liveLevel * 5);
          const size = 4 + Math.max(0.1, liveLevel) * (8 + wave * 5);

          return (
            <span
              key={index}
              className="rounded-full bg-blue-700/70 shadow-[0_0_18px_rgba(29,78,216,0.35)]"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                animation: responsePlaying
                  ? `pulse ${0.7 + (index % 4) * 0.08}s ease-in-out infinite`
                  : undefined,
              }}
            />
          );
        })}
      </div>
    );
  };

  const Bubble = ({ m }) => {
    const isUser = m.sender === "user";

    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs border shadow-sm backdrop-blur-xl ${
            isUser
              ? "bg-blue-700 text-white border-blue-700/20"
              : "bg-white/70 border-white/60 text-slate-800"
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
              <audio
                controls
                src={m.audioUrl}
                className="w-56"
                onPlay={() => setResponsePlaying(true)}
                onPause={() => setResponsePlaying(false)}
                onEnded={() => setResponsePlaying(false)}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-md"
        onClick={() => !processing && onClose?.()}
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/45 bg-white/45 shadow-2xl shadow-blue-900/20 ring-1 ring-white/25 backdrop-blur-2xl">
        <VoiceGrains />

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/45 bg-white/35">
          <div>
            <h2 className="text-sm md:text-base font-extrabold text-slate-950">
              SafarBot Voice Assistant
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearChat}
              disabled={processing}
              className="h-9 px-3 rounded-2xl border border-white/60 bg-white/60 text-slate-700 shadow-sm transition-colors hover:bg-white disabled:opacity-50 text-xs"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => !processing && onClose?.()}
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/60 bg-white/60 text-[0px] text-transparent shadow-sm transition-colors hover:bg-white"
            >
              <X size={16} className="text-slate-700" />
              ✕
            </button>
          </div>
        </div>

        <div
          ref={listRef}
          className="h-[55vh] md:h-[60vh] overflow-y-auto p-4 space-y-3"
        >
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 text-xs mt-8">
              Try voice: “Islamabad se Lahore kal”
            </div>
          ) : (
            messages.map((m) => <Bubble key={m.id} m={m} />)
          )}

          {processing && (
            <div className="text-center text-[11px] text-slate-500">
              SafarBot is thinking...
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/45 bg-white/35">
          <div className="flex gap-2 items-center">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder="Type your message..."
              className="flex-1 rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm outline-none transition focus:ring-2 focus:ring-blue-600/30"
              disabled={processing}
            />

            <button
              type="button"
              onClick={sendText}
              disabled={processing}
              className="flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-colors hover:bg-blue-800 disabled:opacity-50"
            >
              <Send size={16} />
              <span className="hidden sm:inline">Send</span>
            </button>

            {!recording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={processing}
              className="flex h-10 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 text-[0px] font-semibold text-transparent transition-colors hover:bg-blue-100 disabled:opacity-50"
              >
                <Mic2 size={17} className="text-blue-700" />
                🎙
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex h-10 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-[0px] font-semibold text-transparent transition-colors hover:bg-red-100"
              >
                <Square size={14} className="text-red-700" />
                <span className="hidden text-sm text-red-700 sm:inline">Stop</span>
                ⏹ Stop
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default VoiceChatModal;
