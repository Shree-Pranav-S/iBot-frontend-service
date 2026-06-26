import React, { useEffect, useRef, useState } from 'react';
import {
  AudioLines,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Sparkles,
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
  const statusCopy = (() => {
    if (status === 'idle') return 'Connect to run a short practice interview.';
    if (status === 'connecting') return 'Opening the practice room.';
    if (isLive && !sessionStarted) return 'Connected. Start practice when ready.';
    if (isRecording) return 'Recording your response.';
    if (isBotSpeaking) return 'iBot is responding.';
    if (isLive) return 'Use the mic control when it is your turn.';
    return 'Practice session ended.';
  })();

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-white text-slate-900">
      <audio
        ref={audioRef}
        hidden
        onPlay={() => setIsBotSpeaking(true)}
        onEnded={() => setIsBotSpeaking(false)}
        onPause={() => setIsBotSpeaking(false)}
      />

      <header className="z-20 flex min-h-[72px] items-center justify-between gap-4 border-b border-white/80 bg-white/[0.96] px-4 py-3 shadow-sm shadow-slate-200/50 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onExit}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.96]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Exit
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">Practice Session</p>
            <p className="truncate text-[10px] font-black uppercase text-emerald-700">Demo interview</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <StatusPill status={status} isBotSpeaking={isBotSpeaking} />
          <button
            id="btn-toggle-demo-mic"
            onClick={handleToggleMic}
            disabled={!isLive || !sessionStarted}
            title={isRecording ? 'Stop recording' : 'Start recording'}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm shadow-sm transition-all active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-35 ${
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
              className="inline-flex h-10 items-center gap-2 rounded-full border border-red-200 bg-white px-3 text-[11px] font-black text-red-500 shadow-sm transition-all hover:border-red-500 hover:bg-red-500 hover:text-white active:scale-[0.96]"
              title="End session"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">End</span>
            </button>
          )}
        </div>
      </header>

      <main className="ibot-interview-room-bg min-h-0 flex-1 p-4 sm:p-5 lg:p-6">
        <div className="mx-auto grid h-full min-h-0 w-full max-w-[1500px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.78fr)]">
          <section className="ibot-stage-panel relative flex min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-lg border border-white/80 p-6 shadow-xl shadow-slate-900/10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />

            <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-5 text-center">
              <Ibot3DAvatar isSpeaking={isBotSpeaking} />

              <div className="rounded-lg border border-white/80 bg-white/[0.9] px-5 py-4 shadow-lg shadow-slate-200/60">
                <div className="mb-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-emerald-700">
                  <span className={`h-2 w-2 rounded-full ${isRecording || isBotSpeaking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  Practice status
                </div>
                <p className="text-lg font-black text-slate-950">{statusCopy}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {status === 'idle' && (
                  <button
                    id="btn-connect-demo"
                    onClick={handleConnect}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-7 py-3 text-sm font-black text-white shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-700/20 active:translate-y-0 active:scale-[0.98]"
                  >
                    <Radio className="h-4 w-4" />
                    Connect
                  </button>
                )}

                {status === 'connecting' && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-black text-slate-600 shadow-sm backdrop-blur">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    Connecting...
                  </div>
                )}

                {isLive && !sessionStarted && (
                  <button
                    id="btn-start-demo-session"
                    onClick={handleStartSession}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-7 py-3 text-sm font-black text-white shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-700/20 active:translate-y-0 active:scale-[0.98]"
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
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-5 py-3 text-xs font-black text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.98]"
                  >
                    <WifiOff className="h-4 w-4" />
                    Reconnect
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="ibot-caption-panel flex min-h-[320px] flex-col overflow-hidden rounded-lg border border-white/80 bg-white/[0.92] shadow-xl shadow-slate-900/10">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-700">Practice room</p>
                <h2 className="mt-1 text-sm font-black text-slate-950">Transcript</h2>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100">
                  <AudioLines className="h-3.5 w-3.5" />
                  Recording
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 p-4">
              <TranscriptPanel messages={messages} isBotSpeaking={isBotSpeaking} isRecording={isRecording} />
            </div>

            {isEnded && messages.length > 0 && (
              <div className="border-t border-slate-100 bg-white/60 px-4 py-3">
                <CompletionNotice type="ended" />
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
