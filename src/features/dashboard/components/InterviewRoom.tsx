import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronRight,
  Loader2,
  Mic,
  PhoneOff,
  Radio,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useInterviewSocket } from '../hooks/useInterviewSocket';
import { PcmAudioStreamer } from '../utils/pcmAudioStreamer';
import {
  CompletionNotice,
  Ibot3DAvatar,
  SectionProgress,
  StatusPill,
  TimerPill,
  TranscriptPanel,
} from './InterviewExperience';

interface InterviewRoomProps {
  token: string;
  onExit?: () => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({ token }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioStreamerRef = useRef<PcmAudioStreamer | null>(null);
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

  const stopMicrophone = useCallback(() => {
    audioStreamerRef.current?.stop();
    audioStreamerRef.current = null;
    setIsRecording(false);
  }, []);

  const startMicrophone = useCallback(async () => {
    if (audioStreamerRef.current) return;

    const streamer = new PcmAudioStreamer({ onChunk: sendAudioChunk });

    try {
      await streamer.start();
      audioStreamerRef.current = streamer;
      setIsRecording(true);
    } catch (error) {
      streamer.stop();
      throw error;
    }
  }, [sendAudioChunk]);

  useEffect(() => {
    return () => stopMicrophone();
  }, [stopMicrophone]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!lastAudioBytes || !audioRef.current) return;

    const url = URL.createObjectURL(lastAudioBytes);
    audioRef.current.src = url;
    setIsAudioPlaying(true);
    audioRef.current.play().catch(() => setIsAudioPlaying(false));

    return () => URL.revokeObjectURL(url);
  }, [lastAudioBytes]);

  useEffect(() => {
    const latestUserMessage = messages.filter((msg) => msg.role === 'user').at(-1);
    if (!latestUserMessage || latestUserMessage.isFinal || !audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsAudioPlaying(false);
  }, [messages]);

  useEffect(() => {
    if (sessionStarted && status === 'connected') {
      timerRef.current = setInterval(() => {
        setElapsedSecs((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionStarted, status]);

  const handleConnect = useCallback(() => {
    connect();
  }, [connect]);

  const handleStartSession = useCallback(async () => {
    startSession();
    setSessionStarted(true);

    try {
      await startMicrophone();
    } catch {
      alert('Microphone access denied or unavailable. Please allow microphone access and try again.');
    }
  }, [startSession, startMicrophone]);

  const handleStop = useCallback(() => {
    if (isRecording) {
      stopMicrophone();
    }
    stopSession();
    setSessionStarted(false);
    setIsAudioPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [isRecording, stopMicrophone, stopSession]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLive = status === 'connected';
  const isEnded = status === 'closed' || status === 'error';
  const { currentSection, isInterviewComplete, isTerminated, isBotSpeaking } = interviewMeta;
  const botIsActive = isBotSpeaking || isAudioPlaying;

  return (
    <div className="ibot-interview-room-bg relative flex h-full min-h-0 flex-col overflow-hidden text-slate-900">
      <audio
        ref={audioRef}
        hidden
        onPlay={() => setIsAudioPlaying(true)}
        onEnded={() => setIsAudioPlaying(false)}
        onPause={() => setIsAudioPlaying(false)}
      />

      <div className="z-20 flex min-h-16 items-center justify-between gap-4 border-b border-white/70 bg-white/72 px-4 py-3 shadow-sm shadow-slate-200/50 backdrop-blur-xl sm:px-6">
        <div className="min-w-0 flex-1">
          {currentSection ? (
            <SectionProgress
              sectionName={currentSection.sectionName}
              sectionNumber={currentSection.sectionNumber}
              totalSections={currentSection.totalSections}
              skill={currentSection.skill}
            />
          ) : (
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-500 text-white shadow-md shadow-emerald-200/50">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">AI Interview</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Interview Room</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {sessionStarted && <TimerPill value={formatTime(elapsedSecs)} />}
          <StatusPill status={status} isBotSpeaking={botIsActive} />
          {isRecording && (
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 sm:inline-flex">
              <Mic className="h-3 w-3" />
              Listening
            </span>
          )}
          {(isLive || isRecording) && !isInterviewComplete && (
            <button
              id="btn-end-session"
              onClick={handleStop}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-red-200 bg-white px-3 text-[11px] font-black text-red-500 shadow-sm transition-all hover:border-red-500 hover:bg-red-500 hover:text-white active:scale-95"
              title="End session"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">End</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <section className="relative flex min-h-[300px] flex-[1.05] items-center justify-center overflow-hidden px-4 py-6 sm:min-h-[360px]">
          <div className="pointer-events-none absolute left-1/2 top-8 h-48 w-[78vw] max-w-4xl -translate-x-1/2 rounded-full bg-emerald-200/25 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />

          <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-4 text-center">
            <Ibot3DAvatar isSpeaking={botIsActive} />

            {status === 'idle' && (
              <button
                id="btn-connect-interview"
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
                id="btn-start-session"
                onClick={handleStartSession}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-indigo-600 px-7 py-3 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-500/25 active:translate-y-0 active:scale-95"
              >
                <Wifi className="h-4 w-4" />
                Start Interview
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {isEnded && !isInterviewComplete && (
              <button
                id="btn-reconnect"
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
              <TranscriptPanel messages={messages} isBotSpeaking={botIsActive} isRecording={isRecording} />
              <div ref={bottomRef} />
            </div>

            {isInterviewComplete && <CompletionNotice type="complete" />}
            {isTerminated && <CompletionNotice type="terminated" />}
            {isEnded && !isInterviewComplete && !isTerminated && messages.length > 0 && (
              <CompletionNotice type="ended" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
