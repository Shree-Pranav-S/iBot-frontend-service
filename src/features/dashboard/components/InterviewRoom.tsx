import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '@livekit/components-styles/index.css';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
  useTranscriptions,
  useVoiceAssistant,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import {
  AudioLines,
  ChevronRight,
  Loader2,
  Mic,
  PhoneOff,
  ShieldCheck,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { useLiveKitInterviewToken } from '../hooks/useLiveKitInterviewToken';
import type { ChatMessage } from '../../../types/socket.types';
import {
  CompletionNotice,
  Ibot3DAvatar,
  StatusPill,
  TimerPill,
  TranscriptPanel,
} from './InterviewExperience';

const TRANSCRIPTION_FINAL_ATTRIBUTE = 'lk.transcription_final';
const TRANSCRIPTION_SEGMENT_ATTRIBUTE = 'lk.segment_id';
const TURN_GROUP_GAP_MS = 12_000;
const MAX_RENDERED_TRANSCRIPTION_SEGMENTS = 96;
const CLOSING_MESSAGE_MARKERS = [
  'thank you for completing the interview',
  'thank you for completing your interview',
  'thank you for completing it',
  'next step will be handled after this session',
  'i have enough information from this interview',
  'i have captured your responses',
];

type LiveTranscription = ReturnType<typeof useTranscriptions>[number];

const normalizeTimestampMs = (timestamp: number | undefined) => {
  const value = Number(timestamp || Date.now());
  return value < 1_000_000_000_000 ? value * 1000 : value;
};

const isFinalTranscription = (transcription: LiveTranscription) => {
  const raw = transcription.streamInfo.attributes?.[TRANSCRIPTION_FINAL_ATTRIBUTE] as unknown;

  if (raw === true || raw === 'true') return true;
  if (raw === false || raw === 'false') return false;

  return false;
};

const appendTranscriptText = (current: string, next: string) => {
  const existing = current.trim();
  const incoming = next.trim();
  if (!existing) return incoming;
  if (!incoming || existing.endsWith(incoming)) return existing;
  if (incoming.startsWith(existing)) return incoming;
  return `${existing} ${incoming}`;
};

const mergeLiveSegmentText = (current: string, next: string) => {
  const existing = current.trim();
  const incoming = next.trim();

  if (!incoming) return existing;
  if (!existing) return incoming;
  if (incoming.startsWith(existing)) return incoming;
  if (existing.includes(incoming)) return existing;

  return `${existing} ${incoming}`;
};

const isAssistantIdentity = (identity: string, localIdentity: string) => {
  const normalized = identity.toLowerCase();
  const local = localIdentity.toLowerCase();

  if (normalized === local) return false;

  return (
    normalized.startsWith('interview-bot') ||
    normalized.includes('agent') ||
    normalized.includes('bot')
  );
};

const isClosingInterviewMessage = (message: ChatMessage) => {
  if (message.role !== 'assistant') return false;

  const text = message.text.toLowerCase().replace(/\s+/g, ' ').trim();
  return CLOSING_MESSAGE_MARKERS.some((marker) => text.includes(marker));
};

const buildTurnMessages = (
  transcriptions: LiveTranscription[],
  localIdentity: string,
): ChatMessage[] => {
  const grouped: Array<
    ChatMessage & {
      participantIdentity: string;
      segmentIds: Set<string>;
      lastTimestampMs: number;
    }
  > = [];

  const recentTranscriptions =
    transcriptions.length > MAX_RENDERED_TRANSCRIPTION_SEGMENTS
      ? transcriptions.slice(-MAX_RENDERED_TRANSCRIPTION_SEGMENTS)
      : transcriptions;

  const sorted = [...recentTranscriptions]
    .filter((transcription) => transcription.text?.trim())
    .sort(
      (a, b) =>
        normalizeTimestampMs(a.streamInfo.timestamp) -
        normalizeTimestampMs(b.streamInfo.timestamp),
    );

  for (const transcription of sorted) {
    const identity = transcription.participantInfo.identity;
    const role = isAssistantIdentity(identity, localIdentity) ? 'assistant' : 'user';
    const timestampMs = normalizeTimestampMs(transcription.streamInfo.timestamp);
    const rawSegmentId =
      transcription.streamInfo.attributes?.[TRANSCRIPTION_SEGMENT_ATTRIBUTE] ||
      transcription.streamInfo.id ||
      `${identity}-${timestampMs}`;
    const segmentId = String(rawSegmentId);
    const isFinal = isFinalTranscription(transcription);
    const last = grouped[grouped.length - 1];
    const canMerge =
      last &&
      last.role === role &&
      last.participantIdentity === identity &&
      timestampMs - last.lastTimestampMs <= TURN_GROUP_GAP_MS;

    if (canMerge) {
      if (last.segmentIds.has(segmentId)) {
        last.text = mergeLiveSegmentText(last.text, transcription.text);
      } else {
        last.segmentIds.add(segmentId);
        last.text = appendTranscriptText(last.text, transcription.text);
      }
      last.isFinal = Boolean(last.isFinal && isFinal);
      last.lastTimestampMs = Math.max(last.lastTimestampMs, timestampMs);
      continue;
    }

    grouped.push({
      id: `${identity}-${segmentId}`,
      role,
      text: transcription.text.trim(),
      isFinal,
      timestamp: new Date(timestampMs),
      participantIdentity: identity,
      segmentIds: new Set([segmentId]),
      lastTimestampMs: timestampMs,
    });
  }

  return grouped.map((message) => ({
    id: message.id,
    role: message.role,
    text: message.text,
    isFinal: message.isFinal,
    timestamp: message.timestamp,
    replyType: message.replyType,
  }));
};

const LiveTranscriptPanel = React.memo(function LiveTranscriptPanel({
  localIdentity,
  isBotSpeaking,
  isRecording,
  onClosingMessage,
}: {
  localIdentity: string;
  isBotSpeaking: boolean;
  isRecording: boolean;
  onClosingMessage: () => void;
}) {
  const transcriptions = useTranscriptions();
  const messages = useMemo(
    () => buildTurnMessages(transcriptions, localIdentity),
    [localIdentity, transcriptions],
  );
  const hasClosingMessage = useMemo(
    () => messages.some(isClosingInterviewMessage),
    [messages],
  );

  useEffect(() => {
    if (hasClosingMessage) onClosingMessage();
  }, [hasClosingMessage, onClosingMessage]);

  return (
    <TranscriptPanel
      messages={messages}
      isBotSpeaking={isBotSpeaking}
      isRecording={isRecording}
    />
  );
});

const InterviewTimer = React.memo(function InterviewTimer({
  durationMins,
  startedAtMs,
  isRunning,
}: {
  durationMins?: number;
  startedAtMs: number;
  isRunning: boolean;
}) {
  const [elapsedSecs, setElapsedSecs] = useState(0);

  useEffect(() => {
    const updateElapsed = () => {
      setElapsedSecs(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
    };

    updateElapsed();
    if (!isRunning) return;

    const intervalId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(intervalId);
  }, [isRunning, startedAtMs]);

  const timerText = useMemo(() => {
    if (!durationMins) {
      const minutes = Math.floor(elapsedSecs / 60);
      const seconds = elapsedSecs % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    const totalSeconds = durationMins * 60;
    const remaining = Math.max(0, totalSeconds - elapsedSecs);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [durationMins, elapsedSecs]);

  return <TimerPill value={timerText} />;
});

interface InterviewRoomProps {
  token: string;
  durationMins?: number;
  onExit?: () => void;
  onComplete?: () => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({ token, durationMins, onExit, onComplete }) => {
  const { data, loading, error, createToken } = useLiveKitInterviewToken(token);
  const [connect, setConnect] = useState(false);

  const startInterview = async () => {
    const tokenData = await createToken();
    if (tokenData) {
      setConnect(true);
    }
  };

  if (!data) {
    return (
      <div className="ibot-interview-room-bg relative flex h-full min-h-0 flex-col items-center justify-center overflow-hidden p-6 text-slate-900">
        <div className="relative w-full max-w-xl rounded-lg border border-white/80 bg-white/[0.86] p-8 text-center shadow-2xl shadow-slate-900/10 backdrop-blur-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/20">
            <Sparkles className="h-9 w-9" />
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure live room
          </div>
          <h1 className="font-display text-3xl font-black text-slate-950">AI interview setup</h1>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-relaxed text-slate-600">
            Connect when you are ready. Your microphone will be enabled for a live, voice-first interview.
          </p>

          {error && (
            <p className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={startInterview}
            disabled={loading}
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-8 py-4 text-sm font-black text-white shadow-xl shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-700/20 active:translate-y-0 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                Start Interview
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={data.token}
      serverUrl={data.livekit_url}
      connect={connect}
      audio={{
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }}
      video={false}
      options={{
        adaptiveStream: true,
        dynacast: true,
      }}
      className="flex h-full flex-col"
    >
      <InterviewStage durationMins={durationMins} onExit={onExit} onComplete={onComplete} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};

function InterviewStage({
  durationMins,
  onExit,
  onComplete,
}: {
  durationMins?: number;
  onExit?: () => void;
  onComplete?: () => void;
}) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const { isMicrophoneEnabled, lastMicrophoneError, localParticipant, microphoneTrack } = useLocalParticipant();
  const { agent, state: agentState } = useVoiceAssistant();

  const [micError, setMicError] = useState<string | null>(null);
  const [timerStartedAtMs, setTimerStartedAtMs] = useState<number | null>(null);
  const [sessionPhase, setSessionPhase] = useState<'active' | 'complete' | 'ended'>('active');
  const [closingMessageDetected, setClosingMessageDetected] = useState(false);
  const hasConnectedRef = useRef(false);
  const hasAutoDisconnectedRef = useRef(false);
  const hasCompletionNotifiedRef = useRef(false);

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected || isMicrophoneEnabled) return;

    let cancelled = false;
    localParticipant
      .setMicrophoneEnabled(true, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      })
      .then((publication) => {
        if (cancelled) return;
        setMicError(publication ? null : 'Microphone was not published to the room.');
      })
      .catch((err) => {
        if (cancelled) return;
        setMicError(err instanceof Error ? err.message : 'Unable to enable microphone.');
      });

    return () => {
      cancelled = true;
    };
  }, [connectionState, isMicrophoneEnabled, localParticipant]);

  const endSession = () => {
    setSessionPhase('ended');
    room.disconnect();
    if (onExit) onExit();
  };

  const isLive = connectionState === ConnectionState.Connected;
  const botIsSpeaking = agentState === 'speaking';
  const botIsProcessing = agentState === 'thinking';
  const micIsPublished = Boolean(microphoneTrack) && isMicrophoneEnabled;
  const agentIsReady = Boolean(agent) && agentState !== 'connecting' && agentState !== 'disconnected';
  const isRecording = isLive && micIsPublished && agentState === 'listening';
  const displayedMicError = micError || lastMicrophoneError?.message || null;
  const readinessText = (() => {
    if (connectionState === ConnectionState.Connecting) return 'Connecting to LiveKit';
    if (!isLive) return 'Connection closed';
    if (!agent) return 'Starting interviewer';
    if (!agentIsReady) return 'Preparing interviewer';
    if (!micIsPublished) return 'Connecting microphone';
    if (agentState === 'speaking') return 'iBot is speaking';
    if (agentState === 'thinking') return 'Processing your response';
    return 'Ready for your response';
  })();

  const markClosingMessageDetected = useCallback(() => {
    setClosingMessageDetected(true);
  }, []);

  const notifyCompletion = useCallback(() => {
    if (hasCompletionNotifiedRef.current) return;
    hasCompletionNotifiedRef.current = true;
    if (onComplete) onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      hasConnectedRef.current = true;
    }
  }, [connectionState]);

  useEffect(() => {
    if (timerStartedAtMs !== null || agentState !== 'speaking') return;

    const frame = window.requestAnimationFrame(() => {
      setTimerStartedAtMs(Date.now());
    });

    return () => window.cancelAnimationFrame(frame);
  }, [agentState, timerStartedAtMs]);

  useEffect(() => {
    if (!closingMessageDetected || botIsSpeaking || sessionPhase !== 'active') return;

    const closeTimer = window.setTimeout(() => {
      setSessionPhase('complete');

      if (
        !hasAutoDisconnectedRef.current &&
        connectionState !== ConnectionState.Disconnected
      ) {
        hasAutoDisconnectedRef.current = true;
        room.disconnect();
      }
      notifyCompletion();
    }, 400);

    return () => window.clearTimeout(closeTimer);
  }, [botIsSpeaking, closingMessageDetected, connectionState, notifyCompletion, room, sessionPhase]);

  useEffect(() => {
    if (
      connectionState !== ConnectionState.Disconnected ||
      !hasConnectedRef.current ||
      sessionPhase !== 'active'
    ) {
      return;
    }

    setSessionPhase(closingMessageDetected ? 'complete' : 'ended');
    if (closingMessageDetected) notifyCompletion();
  }, [closingMessageDetected, connectionState, notifyCompletion, sessionPhase]);

  let statusStr: 'idle' | 'connecting' | 'connected' | 'complete' | 'error' | 'closed' = 'idle';
  if (sessionPhase === 'complete') statusStr = 'complete';
  else if (sessionPhase === 'ended') statusStr = 'closed';
  else if (connectionState === ConnectionState.Connected && agentIsReady) statusStr = 'connected';
  else if (connectionState === ConnectionState.Connected) statusStr = 'connecting';
  else if (connectionState === ConnectionState.Connecting) statusStr = 'connecting';
  else if (connectionState === ConnectionState.Disconnected) statusStr = 'closed';

  return (
    <div className="ibot-interview-room-bg relative flex h-full min-h-0 w-full flex-col overflow-hidden text-slate-900">
      <header className="z-20 flex min-h-[72px] items-center justify-between gap-4 border-b border-white/80 bg-white/[0.96] px-4 py-3 shadow-sm shadow-slate-200/50 sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">AI Interview</p>
              <p className="truncate text-[10px] font-black uppercase text-emerald-700">Live voice room</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {timerStartedAtMs !== null && sessionPhase === 'active' && (
            <InterviewTimer
              durationMins={durationMins}
              startedAtMs={timerStartedAtMs}
              isRunning={isLive}
            />
          )}
          <StatusPill status={statusStr} isBotSpeaking={botIsSpeaking} />
          {isRecording && (
            <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 sm:inline-flex">
              <AudioLines className="h-3.5 w-3.5" />
              Listening
            </span>
          )}
          {isLive && !micIsPublished && (
            <span
              className="hidden items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-700 sm:inline-flex"
              title={displayedMicError || 'Publishing microphone'}
            >
              <Mic className="h-3.5 w-3.5" />
              Mic connecting
            </span>
          )}
          {isLive && sessionPhase === 'active' && (
            <button
              onClick={endSession}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-red-200 bg-white px-3 text-[11px] font-black text-red-500 shadow-sm transition-all hover:border-red-500 hover:bg-red-500 hover:text-white active:scale-[0.96]"
              title="End session"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">End</span>
            </button>
          )}
        </div>
      </header>

      <main className="min-h-0 flex-1 p-4 sm:p-5 lg:p-6">
        <div className="mx-auto grid h-full min-h-0 w-full max-w-[1500px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.78fr)]">
          <section className="ibot-stage-panel relative flex min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-lg border border-white/80 p-6 shadow-xl shadow-slate-900/10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />
            <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />

            {sessionPhase === 'active' ? (
              <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-5 text-center">
                <Ibot3DAvatar isSpeaking={botIsSpeaking} />

                <div className="rounded-lg border border-white/80 bg-white/[0.94] px-5 py-4 shadow-lg shadow-slate-200/60">
                  <div className="mb-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-emerald-700">
                    <span className={`h-2 w-2 rounded-full ${isRecording || botIsSpeaking || botIsProcessing ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    Session state
                  </div>
                  <p className="text-lg font-black text-slate-950">{readinessText}</p>
                </div>

                {connectionState === ConnectionState.Connecting && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-black text-slate-600 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    Connecting...
                  </div>
                )}

                {displayedMicError && isLive && (
                  <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 shadow-sm">
                    Microphone issue: {displayedMicError}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative z-10 flex max-w-md flex-col items-center text-center" aria-live="polite">
                <CompletionNotice type={sessionPhase === 'complete' ? 'complete' : 'ended'} />
                <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
                  {sessionPhase === 'complete'
                    ? 'Your interview has been submitted and the room is now closed.'
                    : 'This interview room is no longer active.'}
                </p>
              </div>
            )}

          </section>

          <section className="ibot-caption-panel flex min-h-[320px] flex-col overflow-hidden rounded-lg border border-white/80 bg-white/[0.92] shadow-xl shadow-slate-900/10">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-700">Live room</p>
                <h2 className="mt-1 text-sm font-black text-slate-950">Transcript</h2>
              </div>
              {isRecording ? (
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100">
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
              ) : (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-500">
                  Auto scroll
                </span>
              )}
            </div>

            <div className="min-h-0 flex-1 p-4">
              <LiveTranscriptPanel
                localIdentity={room.localParticipant.identity}
                isBotSpeaking={botIsSpeaking}
                isRecording={isRecording}
                onClosingMessage={markClosingMessageDetected}
              />
            </div>

            {sessionPhase !== 'active' && (
              <div className="border-t border-slate-100 bg-white/70 px-4 py-3">
                <CompletionNotice type={sessionPhase === 'complete' ? 'complete' : 'ended'} />
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
