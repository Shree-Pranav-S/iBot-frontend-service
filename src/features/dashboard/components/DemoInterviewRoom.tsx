import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useDemoInterviewSocket } from '../hooks/useDemoInterviewSocket';
import {
  CompletionNotice,
  Ibot3DAvatar,
  StatusPill,
  TranscriptPanel,
} from './InterviewExperience';

interface DemoInterviewRoomProps {
  token: string;
  onExit: () => void;
}

export const DemoInterviewRoom: React.FC<DemoInterviewRoomProps> = ({ token, onExit }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!lastAudioBytes || !audioRef.current) return;

    const url = URL.createObjectURL(lastAudioBytes);
    audioRef.current.src = url;
    setIsBotSpeaking(true);
    audioRef.current.play().catch(() => setIsBotSpeaking(false));

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
      const options: MediaRecorderOptions = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : {};
      const recorder = new MediaRecorder(stream, options);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          e.data.arrayBuffer().then((buf) => sendAudioChunk(buf));
        }
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };
      recorder.start(250);
      mediaRecRef.current = recorder;
      setIsRecording(true);
    } catch {
      alert('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const handleStop = () => {
    if (isRecording) {
      mediaRecRef.current?.stop();
      setIsRecording(false);
    }
    stopSession();
    setSessionStarted(false);
    setIsBotSpeaking(false);
  };

  const isLive = status === 'connected';
  const isEnded = status === 'closed' || status === 'error';

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-white text-slate-900">
      <audio
        ref={audioRef}
        hidden
        onPlay={() => setIsBotSpeaking(true)}
        onEnded={() => setIsBotSpeaking(false)}
        onPause={() => setIsBotSpeaking(false)}
      />

      <header className="z-20 flex min-h-16 items-center justify-between gap-4 border-b border-white/70 bg-white/78 px-4 py-3 shadow-sm shadow-slate-200/50 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onExit}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Exit
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">Practice Session</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Demo</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <StatusPill status={status} isBotSpeaking={isBotSpeaking} />
          <button
            id="btn-toggle-demo-mic"
            onClick={handleToggleMic}
            disabled={!isLive || !sessionStarted}
            title={isRecording ? 'Stop recording' : 'Start recording'}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${
              isRecording
                ? 'border-red-500 bg-red-500 text-white shadow-red-200/60'
                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          {(isLive || isRecording) && (
            <button
              id="btn-end-demo-session"
              onClick={handleStop}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-red-200 bg-white px-3 text-[11px] font-black text-red-500 shadow-sm transition-all hover:border-red-500 hover:bg-red-500 hover:text-white active:scale-95"
              title="End session"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">End</span>
            </button>
          )}
        </div>
      </header>

      <div className="ibot-interview-room-bg relative flex min-h-0 flex-1 flex-col">
        <section className="relative flex min-h-[300px] flex-[1.05] items-center justify-center overflow-hidden px-4 py-6 sm:min-h-[360px]">
          <div className="pointer-events-none absolute left-1/2 top-8 h-48 w-[78vw] max-w-4xl -translate-x-1/2 rounded-full bg-emerald-200/25 blur-3xl" />
          <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-4 text-center">
            <Ibot3DAvatar isSpeaking={isBotSpeaking} />

            {status === 'idle' && (
              <button
                id="btn-connect-demo"
                onClick={handleConnect}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-indigo-600 px-7 py-3 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-500/25 active:translate-y-0 active:scale-95"
              >
                <Radio className="h-4 w-4" />
                Connect
              </button>
            )}

            {status === 'connecting' && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-bold text-slate-600 shadow-sm backdrop-blur">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                Connecting...
              </div>
            )}

            {isLive && !sessionStarted && (
              <button
                id="btn-start-demo-session"
                onClick={handleStartSession}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-indigo-600 px-7 py-3 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-500/25 active:translate-y-0 active:scale-95"
              >
                <Wifi className="h-4 w-4" />
                Start Practice
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {isEnded && (
              <button
                id="btn-reconnect-demo"
                onClick={handleConnect}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-5 py-2.5 text-xs font-black text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
              >
                <WifiOff className="h-4 w-4" />
                Reconnect
              </button>
            )}
          </div>
        </section>

        <section className="relative flex min-h-0 flex-[0.95] flex-col border-t border-white/75 bg-white/68 px-4 py-4 shadow-[0_-18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Subtitles</p>
              {isRecording && (
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                  <span className="flex h-3 items-end gap-[2px]">
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="w-[3px] rounded-full bg-emerald-500 animate-pulse"
                        style={{ height: `${6 + i * 2}px`, animationDelay: `${i * 0.08}s` }}
                      />
                    ))}
                  </span>
                  Speak clearly
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1">
              <TranscriptPanel messages={messages} isBotSpeaking={isBotSpeaking} isRecording={isRecording} />
              <div ref={bottomRef} />
            </div>

            {isEnded && messages.length > 0 && <CompletionNotice type="ended" />}
          </div>
        </section>
      </div>
    </div>
  );
};
