import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Wifi,
  WifiOff,
  Loader2,
  Bot,
  User,
  Radio,
  Volume2,
  Clock,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useInterviewSocket } from "../hooks/useInterviewSocket";
import type { ChatMessage } from "../../../types/socket.types";

interface InterviewRoomProps {
  token: string;
  onExit?: () => void;
}

// ── Section progress bar ─────────────────────────────────────────────────────

const SectionProgress: React.FC<{
  sectionName: string;
  sectionNumber: number;
  totalSections: number;
  skill: string;
}> = ({ sectionName, sectionNumber, totalSections, skill }) => {
  const progress = (sectionNumber / totalSections) * 100;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100">
          <Layers className="h-3.5 w-3.5 text-indigo-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900 leading-none">{sectionName}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Section {sectionNumber} of {totalSections} · {skill.replace(/_/g, ' ')}
          </p>
        </div>
      </div>
      <div className="flex-1 max-w-[160px]">
        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ── AI Avatar ────────────────────────────────────────────────────────────────

const AIAvatar: React.FC<{ isSpeaking: boolean }> = ({ isSpeaking }) => (
  <div className="relative">
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg transition-all duration-500 ${
        isSpeaking
          ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-300 scale-110"
          : "bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-indigo-200"
      }`}
    >
      <Bot className="h-5 w-5 text-white" />
    </div>
    {isSpeaking && (
      <>
        <span className="absolute -inset-1 rounded-2xl bg-indigo-400/30 animate-ping" />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 border-2 border-white">
          <Volume2 className="h-2 w-2 text-white" />
        </span>
      </>
    )}
    {!isSpeaking && (
      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
    )}
  </div>
);

// ── Status pill ──────────────────────────────────────────────────────────────

const StatusPill: React.FC<{ status: string; isBotSpeaking: boolean }> = ({
  status,
  isBotSpeaking,
}) => {
  if (isBotSpeaking) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-[11px] font-semibold text-indigo-700 animate-pulse">
        <Volume2 className="h-3 w-3" />
        AI Speaking
      </span>
    );
  }

  const config: Record<string, { color: string; label: string; pulse: boolean }> = {
    idle: { color: "bg-gray-100 border-gray-200 text-gray-500", label: "Not connected", pulse: false },
    connecting: { color: "bg-amber-50 border-amber-200 text-amber-700", label: "Connecting…", pulse: true },
    connected: { color: "bg-emerald-50 border-emerald-200 text-emerald-700", label: "Live", pulse: true },
    error: { color: "bg-red-50 border-red-200 text-red-600", label: "Error", pulse: false },
    closed: { color: "bg-gray-100 border-gray-200 text-gray-500", label: "Ended", pulse: false },
  };
  const { color, label, pulse } = config[status] ?? config.idle;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-gray-400'} ${pulse ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
};

// ── Message bubble ───────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ msg: ChatMessage; isBotSpeaking: boolean }> = ({
  msg,
  isBotSpeaking,
}) => {
  const isAssistant = msg.role === "assistant";
  const isSystem = msg.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="rounded-full bg-gray-100/80 backdrop-blur-sm border border-gray-200/60 px-4 py-1.5 text-[11px] text-gray-500 italic">
          {msg.text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-end gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
    >
      {isAssistant && <AIAvatar isSpeaking={isBotSpeaking && msg === msg} />}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
          isAssistant
            ? "rounded-bl-md bg-white border border-gray-200/80 text-gray-800 shadow-sm"
            : `rounded-br-md text-white shadow-sm ${
                msg.isFinal
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500"
                  : "bg-indigo-400/80 italic"
              }`
        }`}
      >
        {msg.text}
        {!msg.isFinal && (
          <span className="ml-1.5 inline-flex gap-0.5">
            <span className="animate-bounce h-1 w-1 rounded-full bg-white/70" />
            <span className="animate-bounce h-1 w-1 rounded-full bg-white/70" style={{ animationDelay: "0.1s" }} />
            <span className="animate-bounce h-1 w-1 rounded-full bg-white/70" style={{ animationDelay: "0.2s" }} />
          </span>
        )}
      </div>
      {!isAssistant && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 shadow-sm">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      )}
    </div>
  );
};

// ── main component ────────────────────────────────────────────────────────────

export const InterviewRoom: React.FC<InterviewRoomProps> = ({ token }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    messages,
    status,
    lastAudioBytes,
    interviewMeta,
    connect,
    startSession,
    sendAudioChunk,
    stopSession,
  } = useInterviewSocket({ token });

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Play TTS audio whenever a new blob arrives
  useEffect(() => {
    if (!lastAudioBytes || !audioRef.current) return;
    const url = URL.createObjectURL(lastAudioBytes);
    audioRef.current.src = url;
    audioRef.current.play().catch(() => {});
    return () => URL.revokeObjectURL(url);
  }, [lastAudioBytes]);

  // Elapsed time counter
  useEffect(() => {
    if (sessionStarted && status === "connected") {
      timerRef.current = setInterval(() => {
        setElapsedSecs((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStarted, status]);

  // ── handlers ─────────────────────────────────────────────────────────────────

  const handleConnect = useCallback(() => {
    connect();
  }, [connect]);

  const handleStartSession = useCallback(async () => {
    startSession();
    setSessionStarted(true);

    // Auto-start microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options: MediaRecorderOptions = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? { mimeType: "audio/webm;codecs=opus" }
        : {};
      const recorder = new MediaRecorder(stream, options);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          e.data.arrayBuffer().then((buf) => sendAudioChunk(buf));
        }
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
      };
      recorder.start(250);
      mediaRecRef.current = recorder;
      setIsRecording(true);
    } catch {
      // Mic access denied — user can still type
    }
  }, [startSession, sendAudioChunk]);



  const handleToggleMic = useCallback(async () => {
    if (isRecording) {
      mediaRecRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options: MediaRecorderOptions = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? { mimeType: "audio/webm;codecs=opus" }
        : {};
      const recorder = new MediaRecorder(stream, options);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          e.data.arrayBuffer().then((buf) => sendAudioChunk(buf));
        }
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
      };
      recorder.start(250);
      mediaRecRef.current = recorder;
      setIsRecording(true);
    } catch {
      alert("Microphone access denied. Please allow microphone access and try again.");
    }
  }, [isRecording, sendAudioChunk]);

  const handleStop = useCallback(() => {
    if (isRecording) {
      mediaRecRef.current?.stop();
      setIsRecording(false);
    }
    stopSession();
    setSessionStarted(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [isRecording, stopSession]);

  // Format elapsed time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ── render ────────────────────────────────────────────────────────────────────

  const isLive = status === "connected";
  const isEnded = status === "closed" || status === "error";
  const { currentSection, isInterviewComplete, isTerminated, isBotSpeaking } = interviewMeta;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: "linear-gradient(135deg, #f8faff 0%, #f1f0ff 50%, #f8faff 100%)" }}>
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} hidden />

      {/* ── Interview Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-200/80 bg-white/70 backdrop-blur-xl px-6 py-3 shadow-sm">
        <div className="flex items-center gap-5">
          {/* Section progress */}
          {currentSection ? (
            <SectionProgress
              sectionName={currentSection.sectionName}
              sectionNumber={currentSection.sectionNumber}
              totalSections={currentSection.totalSections}
              skill={currentSection.skill}
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-bold text-gray-900">AI Interview</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Elapsed timer */}
          {sessionStarted && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 border border-gray-200 px-3 py-1 text-[11px] font-mono font-semibold text-gray-600">
              <Clock className="h-3 w-3 text-gray-400" />
              {formatTime(elapsedSecs)}
            </span>
          )}

          {/* Status */}
          <StatusPill status={status} isBotSpeaking={isBotSpeaking} />

          {/* Mic indicator */}
          {isRecording && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[10px] font-semibold text-red-600 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              REC
            </span>
          )}
        </div>
      </div>

      {/* ── Chat Area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {/* Idle state — connect prompt */}
        {status === "idle" && (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-20">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-2xl shadow-indigo-300/50">
                <Radio className="h-9 w-9 text-white" />
              </div>
              <div className="absolute -inset-3 rounded-3xl bg-indigo-400/20 blur-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                Ready to Interview
              </h3>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                Connect to the AI interview engine and begin your session. Make sure your microphone is ready.
              </p>
            </div>
            <button
              id="btn-connect-interview"
              onClick={handleConnect}
              className="mt-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-violet-700 transition-all shadow-xl shadow-indigo-300/40 hover:shadow-indigo-400/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              Connect to Interview
            </button>
          </div>
        )}

        {/* Connecting */}
        {status === "connecting" && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
              <div className="absolute -inset-4 rounded-full bg-indigo-200/30 blur-lg animate-pulse" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Connecting to interview service…</p>
          </div>
        )}

        {/* Connected but not started */}
        {isLive && !sessionStarted && (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-20">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-200/60">
                <Wifi className="h-7 w-7 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Connected!</h3>
              <p className="text-sm text-gray-500">
                Start the session to begin your AI-powered interview.
              </p>
            </div>
            <button
              id="btn-start-session"
              onClick={handleStartSession}
              className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-violet-700 transition-all shadow-xl shadow-indigo-300/40 hover:shadow-indigo-400/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                Start Interview
                <ChevronRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        )}

        {/* Messages */}
        {(!isLive || sessionStarted) &&
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isBotSpeaking={isBotSpeaking} />
          ))}

        {/* Interview complete banner */}
        {isInterviewComplete && (
          <div className="flex flex-col items-center gap-3 mt-6 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 border border-emerald-200">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">Interview Complete</p>
              <p className="text-xs text-gray-500 mt-1">
                Thank you for your participation. Your responses are being evaluated.
              </p>
            </div>
          </div>
        )}

        {/* Terminated banner */}
        {isTerminated && (
          <div className="flex flex-col items-center gap-3 mt-6 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-200">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">Session Ended</p>
              <p className="text-xs text-gray-500 mt-1">
                The interview session has been terminated.
              </p>
            </div>
          </div>
        )}

        {/* Session ended */}
        {isEnded && !isInterviewComplete && !isTerminated && messages.length > 0 && (
          <div className="flex justify-center mt-4">
            <span className="rounded-full border border-gray-200 bg-gray-100 px-4 py-1.5 text-xs text-gray-500">
              Session ended
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ─────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200/80 bg-white/70 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Microphone */}
          <button
            id="btn-toggle-mic"
            onClick={handleToggleMic}
            disabled={!isLive || !sessionStarted || isInterviewComplete}
            title={isRecording ? "Stop recording" : "Start recording"}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 ${
              isRecording
                ? "bg-red-500 text-white shadow-lg shadow-red-200/60 scale-105"
                : "border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            {isRecording ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
          </button>


          {/* End session */}
          {(isLive || isRecording) && !isInterviewComplete && (
            <button
              id="btn-end-session"
              onClick={handleStop}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200"
              title="End session"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          )}

          {/* Reconnect */}
          {isEnded && !isInterviewComplete && (
            <button
              id="btn-reconnect"
              onClick={handleConnect}
              className="flex h-11 items-center gap-2 px-4 rounded-2xl bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-all"
            >
              <WifiOff className="h-4 w-4" /> Reconnect
            </button>
          )}
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="mt-2.5 flex items-center justify-center gap-2">
            <span className="flex gap-[3px] items-end h-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="w-[3px] bg-red-400 rounded-full animate-pulse"
                  style={{
                    height: `${8 + Math.sin(i * 1.2) * 6}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.6 + i * 0.1}s`,
                  }}
                />
              ))}
            </span>
            <p className="text-[11px] text-red-500 font-medium">
              Listening — speak clearly into your microphone
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
