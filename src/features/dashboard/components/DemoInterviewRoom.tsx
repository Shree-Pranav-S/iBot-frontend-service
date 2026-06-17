import React, { useEffect, useRef, useState } from "react";
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
  ChevronLeft,
  Volume2,
} from "lucide-react";
import { useDemoInterviewSocket } from "../hooks/useDemoInterviewSocket";
import type { ChatMessage } from "../../../types/socket.types";

interface DemoInterviewRoomProps {
  token: string;
  onExit: () => void;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<
    string,
    { color: string; label: string; pulse: boolean }
  > = {
    idle: { color: "bg-gray-400", label: "Not connected", pulse: false },
    connecting: { color: "bg-amber-400", label: "Connecting…", pulse: true },
    connected: { color: "bg-emerald-500", label: "Practice Live", pulse: true },
    error: { color: "bg-red-500", label: "Error", pulse: false },
    closed: { color: "bg-gray-400", label: "Ended", pulse: false },
  };
  const { color, label, pulse } = config[status] ?? config.idle;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
      <span
        className={`h-2 w-2 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`}
      />
      {label}
    </span>
  );
};

const MessageBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const isAssistant = msg.role === "assistant";
  const isSystem = msg.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="rounded-full bg-gray-100 border border-gray-200 px-4 py-1.5 text-xs text-gray-500 italic">
          {msg.text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-end gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
    >
      {isAssistant && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 shadow-md shadow-indigo-200">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isAssistant
            ? "rounded-bl-sm bg-white border border-gray-200 text-gray-900"
            : `rounded-br-sm text-white ${msg.isFinal ? "bg-indigo-600" : "bg-indigo-400 italic"}`
        }`}
      >
        {msg.text}
        {!msg.isFinal && (
          <span className="ml-1 inline-flex gap-0.5">
            <span className="animate-bounce h-1 w-1 rounded-full bg-white/70" />
            <span
              className="animate-bounce h-1 w-1 rounded-full bg-white/70"
              style={{ animationDelay: "0.1s" }}
            />
            <span
              className="animate-bounce h-1 w-1 rounded-full bg-white/70"
              style={{ animationDelay: "0.2s" }}
            />
          </span>
        )}
      </div>
      {!isAssistant && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      )}
    </div>
  );
};

export const DemoInterviewRoom: React.FC<DemoInterviewRoomProps> = ({
  token,
  onExit,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);

  const {
    messages,
    status,
    lastAudioBytes,
    connect,
    startSession,
    sendAudioChunk,
    stopSession,
  } = useDemoInterviewSocket({ token });

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Play TTS audio whenever a new blob arrives
  useEffect(() => {
    if (!lastAudioBytes || !audioRef.current) return;
    const url = URL.createObjectURL(lastAudioBytes);
    audioRef.current.src = url;
    audioRef.current.play().catch(() => {
      /* autoplay may be blocked */
    });
    return () => URL.revokeObjectURL(url);
  }, [lastAudioBytes]);

  const handleConnect = () => {
    connect();
  };

  const handleStartSession = () => {
    startSession();
    setSessionStarted(true);
  };



  const handleToggleMic = async () => {
    if (isRecording) {
      mediaRecRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options: MediaRecorderOptions = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus",
      )
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
      recorder.start(250); // 250ms chunks
      mediaRecRef.current = recorder;
      setIsRecording(true);
    } catch {
      alert(
        "Microphone access denied. Please allow microphone access and try again.",
      );
    }
  };

  const handleStop = () => {
    if (isRecording) {
      mediaRecRef.current?.stop();
      setIsRecording(false);
    }
    stopSession();
    setSessionStarted(false);
  };

  const isLive = status === "connected";
  const isEnded = status === "closed" || status === "error";

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen overflow-hidden">
      {/* Viewport Header */}
      <header className="h-14 border-b border-gray-200 bg-white/80 backdrop-blur-md flex-shrink-0 flex items-center px-8 justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900">
            iBot <span className="text-xs font-semibold text-indigo-600 border border-indigo-200 rounded px-1.5 py-0.5 ml-1 bg-indigo-50">Demo Practice Mode</span>
          </span>
        </div>
      </header>

      <div className="flex-1 min-h-0 bg-gray-50 flex flex-col">
        {/* Hidden audio element for TTS playback */}
        <audio ref={audioRef} hidden />

        {/* Room header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Exit Demo
            </button>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                AI Demo Interview Session (Practice Mode)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">This session does not record scores</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastAudioBytes && (
              <span className="flex items-center gap-1.5 text-xs text-indigo-600 animate-pulse">
                <Volume2 className="h-3.5 w-3.5" /> AI Speaking
              </span>
            )}
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {status === "idle" && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200">
                <Radio className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Ready to Practice
                </h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Connect to practice using STT and TTS without spending interview token limits.
                </p>
              </div>
              <button
                id="btn-connect-demo"
                onClick={handleConnect}
                className="mt-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
              >
                Connect to Demo Room
              </button>
            </div>
          )}

          {status === "connecting" && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-sm text-gray-500">
                Connecting to practice service…
              </p>
            </div>
          )}

          {isLive && !sessionStarted && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 ring-1 ring-emerald-200">
                <Wifi className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Connected!
                </h3>
                <p className="text-sm text-gray-500">
                  Start the session to begin your practice.
                </p>
              </div>
              <button
                id="btn-start-demo-session"
                onClick={handleStartSession}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
              >
                Start Practice Session
              </button>
            </div>
          )}

          {(!isLive || sessionStarted) &&
            messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}

          {isEnded && messages.length > 0 && (
            <div className="flex justify-center mt-4">
              <span className="rounded-full border border-gray-200 bg-gray-100 px-4 py-1.5 text-xs text-gray-500">
                Session ended
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Microphone */}
            <button
              id="btn-toggle-demo-mic"
              onClick={handleToggleMic}
              disabled={!isLive || !sessionStarted}
              title={isRecording ? "Stop recording" : "Start recording"}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-200"
                  : "border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              {isRecording ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>



            {/* End session */}
            {(isLive || isRecording) && (
              <button
                id="btn-end-demo-session"
                onClick={handleStop}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                title="End session"
              >
                <PhoneOff className="h-4 w-4" />
              </button>
            )}

            {/* Reconnect */}
            {isEnded && (
              <button
                id="btn-reconnect-demo"
                onClick={handleConnect}
                className="flex h-11 items-center gap-2 px-4 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-all"
              >
                <WifiOff className="h-4 w-4" /> Reconnect
              </button>
            )}
          </div>

          {isRecording && (
            <p className="mt-2 text-center text-xs text-red-500 animate-pulse">
              🔴 Recording — speak clearly into your microphone
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
