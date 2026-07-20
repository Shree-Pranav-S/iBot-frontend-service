import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '@livekit/components-styles/index.css';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useConnectionState,
  useDataChannel,
  useLocalParticipant,
  useRoomContext,
  useTranscriptions,
  useVoiceAssistant,
} from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import {
  FACE_PROCTORING_ENABLED,
  INTERVIEW_CLOSING_EVENT,
  INTERVIEW_DATA_TOPIC,
  INTERVIEW_PROCTORING_TOPIC,
  INTERVIEW_TERMINATED_EVENT,
  LIVEKIT_FORCE_RELAY,
  PROCTORING_EVENT_RECORDED_EVENT,
  TAB_SWITCH_EVENT,
  TAB_SWITCH_RECORDED_EVENT,
} from '../../../config/livekit';
import {
  AudioLines,
  ChevronRight,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  VideoOff,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { useLiveKitInterviewToken } from '../hooks/useLiveKitInterviewToken';
import {
  useFaceProctoring,
  type FaceProctoringViolationEvent,
} from '../hooks/useFaceProctoring';
import type { ChatMessage } from '../../../types/socket.types';
import { IbotMark } from '../../../components/ui/IbotMark';
import {
  CompletionNotice,
  Ibot3DAvatar,
  StatusPill,
  TimerPill,
  TranscriptPanel,
} from './InterviewExperience';

const TRANSCRIPTION_FINAL_ATTRIBUTE = 'lk.transcription_final';
const TRANSCRIPTION_SEGMENT_ATTRIBUTE = 'lk.segment_id';
const MAX_RENDERED_TRANSCRIPT_MESSAGES = 64;
// Matches every backend CLOSING template prefix when the data-channel signal is missed.
const CLOSING_TRANSCRIPT_PREFIX = 'thank you for completing your interview with';

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
  // New STT segment within the same speaker bubble.
  const existing = current.trim();
  const incoming = next.trim();
  if (!existing) return incoming;
  if (!incoming || existing.endsWith(incoming)) return existing;
  if (incoming.startsWith(existing)) return incoming;
  return `${existing} ${incoming}`;
};

const mergeLiveSegmentText = (current: string, next: string) => {
  // Interim/final refinements for the same lk.segment_id.
  const existing = current.trim();
  const incoming = next.trim();

  if (!incoming) return existing;
  if (!existing) return incoming;
  if (incoming.startsWith(existing)) return incoming;
  if (existing.includes(incoming)) return existing;

  return `${existing} ${incoming}`;
};

const isAssistantIdentity = (identity: string) =>
  identity.toLowerCase().startsWith('interview-bot');

const isClosingInterviewMessage = (message: ChatMessage) => {
  if (message.role !== 'assistant') return false;

  const text = message.text.toLowerCase().replace(/\s+/g, ' ').trim();
  return text.startsWith(CLOSING_TRANSCRIPT_PREFIX);
};

const parseInterviewDataPayload = (payload: Uint8Array) => {
  try {
    return JSON.parse(new TextDecoder().decode(payload)) as {
      type?: string;
      event_id?: string;
      tab_switch_count?: number;
      appended?: boolean;
      reason?: string;
      termination_reason?: string;
      condition?: string;
      violation_type?: string;
    };
  } catch {
    return null;
  }
};

type InterviewTerminationReason =
  | 'tab_switch'
  | 'face_absent'
  | 'multiple_faces'
  | 'unknown';

const normalizeTerminationReason = (payload: {
  reason?: string;
  termination_reason?: string;
  condition?: string;
  violation_type?: string;
  tab_switch_count?: number;
}): InterviewTerminationReason => {
  const rawReason = String(
    payload.termination_reason ??
      payload.reason ??
      payload.condition ??
      payload.violation_type ??
      '',
  )
    .trim()
    .toLowerCase();

  if (rawReason.includes('multiple') && rawReason.includes('face')) {
    return 'multiple_faces';
  }
  if (
    (rawReason.includes('face') && rawReason.includes('absent')) ||
    rawReason.includes('no_face')
  ) {
    return 'face_absent';
  }
  if (rawReason.includes('tab') || typeof payload.tab_switch_count === 'number') {
    return 'tab_switch';
  }
  return 'unknown';
};

const terminationMessage = (
  reason: InterviewTerminationReason,
  tabSwitchCount: number,
) => {
  if (reason === 'face_absent') {
    return 'The interview ended because no face was continuously visible for 30 seconds.';
  }
  if (reason === 'multiple_faces') {
    return 'The interview ended because multiple faces were continuously visible for 20 seconds.';
  }
  if (reason === 'tab_switch') {
    return `The interview ended after ${tabSwitchCount} tab switches were recorded.`;
  }
  return 'The interview was terminated because a proctoring limit was reached.';
};

const buildTurnMessages = (transcriptions: LiveTranscription[]): ChatMessage[] => {
  const grouped: Array<
    ChatMessage & {
      participantIdentity: string;
      segmentIds: Set<string>;
    }
  > = [];

  const sorted = [...transcriptions]
    .filter((transcription) => transcription.text?.trim())
    .sort(
      (a, b) =>
        normalizeTimestampMs(a.streamInfo.timestamp) -
        normalizeTimestampMs(b.streamInfo.timestamp),
    );

  for (const transcription of sorted) {
    const identity = transcription.participantInfo.identity;
    const role = isAssistantIdentity(identity) ? 'assistant' : 'user';
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
      last.participantIdentity === identity;

    if (canMerge) {
      if (last.segmentIds.has(segmentId)) {
        last.text = mergeLiveSegmentText(last.text, transcription.text);
      } else {
        last.segmentIds.add(segmentId);
        last.text = appendTranscriptText(last.text, transcription.text);
      }
      last.isFinal = Boolean(last.isFinal && isFinal);
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
    });
  }

  const messages = grouped.map((message) => ({
    id: message.id,
    role: message.role,
    text: message.text,
    isFinal: message.isFinal,
    timestamp: message.timestamp,
    replyType: message.replyType,
  }));

  return messages.length > MAX_RENDERED_TRANSCRIPT_MESSAGES
    ? messages.slice(-MAX_RENDERED_TRANSCRIPT_MESSAGES)
    : messages;
};

export const LiveTranscriptPanel = React.memo(function LiveTranscriptPanel({
  isBotSpeaking,
  onClosingMessage,
}: {
  isBotSpeaking: boolean;
  onClosingMessage?: () => void;
}) {
  const transcriptions = useTranscriptions();
  const messages = useMemo(
    () => buildTurnMessages(transcriptions),
    [transcriptions],
  );
  const hasClosingMessage = useMemo(
    () => messages.some(isClosingInterviewMessage),
    [messages],
  );

  useEffect(() => {
    if (hasClosingMessage) onClosingMessage?.();
  }, [hasClosingMessage, onClosingMessage]);

  return (
    <TranscriptPanel
      messages={messages}
      isBotSpeaking={isBotSpeaking}
    />
  );
});

const InterviewTimer = React.memo(function InterviewTimer({
  durationMins,
  initialElapsedSecs,
  runningSinceMs,
  isRunning,
}: {
  durationMins?: number;
  initialElapsedSecs: number;
  runningSinceMs: number | null;
  isRunning: boolean;
}) {
  const [elapsedSecs, setElapsedSecs] = useState(initialElapsedSecs);

  useEffect(() => {
    const updateElapsed = () => {
      const connectedElapsed =
        runningSinceMs === null
          ? 0
          : Math.max(0, Math.floor((Date.now() - runningSinceMs) / 1000));
      setElapsedSecs(Math.max(0, initialElapsedSecs + connectedElapsed));
    };

    updateElapsed();
    if (!isRunning || runningSinceMs === null) return;

    const intervalId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(intervalId);
  }, [initialElapsedSecs, isRunning, runningSinceMs]);

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

export const InterviewControlDock: React.FC<{
  isMuted: boolean;
  isMicToggling: boolean;
  onToggleMicrophone: () => void;
  onEndSession: () => void;
}> = ({
  isMuted,
  isMicToggling,
  onToggleMicrophone,
  onEndSession,
}) => (
  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-brand-charcoal/95 p-2 shadow-2xl shadow-black/25 ring-1 ring-black/10 backdrop-blur-xl">
    <button
      type="button"
      onClick={onToggleMicrophone}
      disabled={isMicToggling}
      className={`group inline-flex h-11 min-w-28 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${
        isMuted
          ? 'bg-brand-soft text-brand-hover hover:bg-[#EAD7BE]'
          : 'bg-white text-brand-charcoal hover:bg-brand-soft'
      }`}
      title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      aria-pressed={isMuted}
    >
      {isMicToggling ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isMuted ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4 transition-transform group-hover:scale-110" />
      )}
      {isMuted ? 'Unmute' : 'Mute'}
    </button>
    <span className="h-8 w-px bg-white/15" aria-hidden="true" />
    <button
      type="button"
      onClick={onEndSession}
      className="group inline-flex h-11 min-w-28 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-500 hover:shadow-lg active:translate-y-0 active:scale-[0.97]"
      title="End session"
    >
      <PhoneOff className="h-4 w-4 transition-transform group-hover:-rotate-6" />
      End session
    </button>
  </div>
);

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
      <div className="ibot-candidate-shell ibot-interview-room-bg relative flex h-full min-h-0 flex-col items-center justify-center overflow-hidden p-6 text-[#1F1D1A]">
        <div className="relative w-full max-w-xl rounded-3xl border border-[#E6DED2] bg-white/95 p-9 text-center shadow-[0_28px_80px_-42px_rgba(36,33,29,0.35)] backdrop-blur-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-charcoal text-[#E8C794] shadow-xl shadow-black/15">
            <Sparkles className="h-9 w-9" />
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D9C4A7] bg-brand-soft px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-brand-hover">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure live room
          </div>
          <h1 className="font-display text-3xl font-black tracking-[-0.035em] text-[#1F1D1A]">AI interview setup</h1>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-relaxed text-[#706A61]">
            Connect when you are ready. Your microphone and camera will be enabled for the live interview.
          </p>

          {error && (
            <p className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={startInterview}
            disabled={loading}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-charcoal px-8 py-4 text-sm font-black text-white shadow-xl shadow-black/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-[0_18px_38px_-22px_rgba(154,106,48,0.7)] active:translate-y-0 active:scale-[0.98] disabled:opacity-60"
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
      video={{
        facingMode: 'user',
      }}
      options={{
        adaptiveStream: true,
        dynacast: true,
      }}
      connectOptions={
        LIVEKIT_FORCE_RELAY
          ? { rtcConfig: { iceTransportPolicy: 'relay' } }
          : undefined
      }
      className="flex h-full flex-col"
    >
      <InterviewStage
        durationMins={durationMins}
        initialElapsedSecs={Math.max(0, data.elapsed_secs ?? 0)}
        interviewStarted={Boolean(data.interview_started)}
        initialTabSwitchCount={Math.max(0, data.tab_switch_count ?? 0)}
        onExit={onExit}
        onComplete={onComplete}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};

function InterviewStage({
  durationMins,
  initialElapsedSecs,
  interviewStarted,
  initialTabSwitchCount,
  onExit,
  onComplete,
}: {
  durationMins?: number;
  initialElapsedSecs: number;
  interviewStarted: boolean;
  initialTabSwitchCount: number;
  onExit?: () => void;
  onComplete?: () => void;
}) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const {
    cameraTrack,
    isCameraEnabled,
    isMicrophoneEnabled,
    lastCameraError,
    lastMicrophoneError,
    localParticipant,
    microphoneTrack,
  } = useLocalParticipant();
  const { agent, state: agentState } = useVoiceAssistant();

  const [micError, setMicError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micMutedByUser, setMicMutedByUser] = useState(false);
  const [isMicToggling, setIsMicToggling] = useState(false);
  const [isCameraRecovering, setIsCameraRecovering] = useState(false);
  const [cameraTrackHealthy, setCameraTrackHealthy] = useState(false);
  const [timerStartedAtMs, setTimerStartedAtMs] = useState<number | null>(null);
  const [sessionPhase, setSessionPhase] = useState<
    'active' | 'complete' | 'terminated' | 'ended'
  >('active');
  const [terminationTabSwitchCount, setTerminationTabSwitchCount] = useState(0);
  const [terminationReason, setTerminationReason] =
    useState<InterviewTerminationReason>('unknown');
  const [tabSwitchCount, setTabSwitchCount] = useState(initialTabSwitchCount);
  const [closingSignalReceived, setClosingSignalReceived] = useState(false);
  const hasConnectedRef = useRef(false);
  const hasAutoDisconnectedRef = useRef(false);
  const hasCompletionNotifiedRef = useRef(false);
  const closingSignalReceivedRef = useRef(false);
  const terminationSignalReceivedRef = useRef(false);
  const micMutedByUserRef = useRef(false);
  const pendingTabSwitchesRef = useRef(
    new Map<string, { event_id: string; occurred_at: string }>(),
  );
  const pendingFaceEventsRef = useRef(
    new Map<string, FaceProctoringViolationEvent>(),
  );
  const candidateVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastVisibilityStateRef = useRef(document.visibilityState);

  const signalInterviewClosing = useCallback(() => {
    if (closingSignalReceivedRef.current) return;
    closingSignalReceivedRef.current = true;
    setClosingSignalReceived(true);
  }, []);

  const handleInterviewDataMessage = useCallback((message: { payload: Uint8Array }) => {
    const parsed = parseInterviewDataPayload(message.payload);
    if (parsed?.type === INTERVIEW_CLOSING_EVENT) {
      signalInterviewClosing();
      return;
    }
    if (parsed?.type === TAB_SWITCH_RECORDED_EVENT) {
      if (parsed.event_id) {
        pendingTabSwitchesRef.current.delete(parsed.event_id);
      }
      if (typeof parsed.tab_switch_count === 'number') {
        setTabSwitchCount((current) => Math.max(current, parsed.tab_switch_count ?? 0));
      }
      return;
    }
    if (parsed?.type === PROCTORING_EVENT_RECORDED_EVENT) {
      if (parsed.event_id) {
        pendingFaceEventsRef.current.delete(parsed.event_id);
      }
      return;
    }
    if (parsed?.type === INTERVIEW_TERMINATED_EVENT) {
      terminationSignalReceivedRef.current = true;
      const reason = normalizeTerminationReason(parsed);
      setTerminationReason(reason);
      if (reason === 'tab_switch') {
        const finalCount = Math.max(0, parsed.tab_switch_count ?? 5);
        setTabSwitchCount(finalCount);
        setTerminationTabSwitchCount(finalCount);
      }
      setSessionPhase('terminated');
      room.disconnect();
    }
  }, [room, signalInterviewClosing]);

  useDataChannel(INTERVIEW_DATA_TOPIC, handleInterviewDataMessage);

  useEffect(() => {
    if (
      connectionState !== ConnectionState.Connected ||
      micMutedByUserRef.current ||
      isMicrophoneEnabled
    ) {
      return;
    }

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
  }, [connectionState, isMicrophoneEnabled, localParticipant, micMutedByUser]);

  const toggleMicrophone = async () => {
    if (connectionState !== ConnectionState.Connected || isMicToggling) return;

    const enableMic = micMutedByUser;
    const nextMuted = !enableMic;
    micMutedByUserRef.current = nextMuted;
    setMicMutedByUser(nextMuted);
    setIsMicToggling(true);
    try {
      const publication = await localParticipant.setMicrophoneEnabled(enableMic, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      setMicError(
        enableMic && !publication
          ? 'Microphone was not published to the room.'
          : null,
      );
    } catch (err) {
      micMutedByUserRef.current = !nextMuted;
      setMicMutedByUser(!nextMuted);
      setMicError(err instanceof Error ? err.message : 'Unable to update microphone.');
    } finally {
      setIsMicToggling(false);
    }
  };

  useEffect(() => {
    if (
      connectionState !== ConnectionState.Connected ||
      !micMutedByUserRef.current ||
      !isMicrophoneEnabled ||
      isMicToggling
    ) {
      return;
    }

    void localParticipant.setMicrophoneEnabled(false).catch((err) => {
      setMicError(
        err instanceof Error ? err.message : 'Unable to keep microphone muted.',
      );
    });
  }, [connectionState, isMicToggling, isMicrophoneEnabled, localParticipant]);

  const recoverCamera = useCallback(async () => {
    if (
      connectionState !== ConnectionState.Connected ||
      isCameraRecovering ||
      sessionPhase !== 'active'
    ) {
      return;
    }

    setIsCameraRecovering(true);
    try {
      const publication = await localParticipant.setCameraEnabled(true, {
        facingMode: 'user',
      });
      setCameraError(
        !publication
          ? 'Camera was not published to the room.'
          : null,
      );
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : 'Unable to restore camera.');
    } finally {
      setIsCameraRecovering(false);
    }
  }, [connectionState, isCameraRecovering, localParticipant, sessionPhase]);

  useEffect(() => {
    if (
      connectionState !== ConnectionState.Connected ||
      sessionPhase !== 'active' ||
      (cameraTrack && isCameraEnabled) ||
      isCameraRecovering
    ) {
      return;
    }

    const retryTimer = window.setTimeout(() => {
      void recoverCamera();
    }, 750);
    return () => window.clearTimeout(retryTimer);
  }, [
    cameraTrack,
    connectionState,
    isCameraEnabled,
    isCameraRecovering,
    recoverCamera,
    sessionPhase,
  ]);

  useEffect(() => {
    const mediaTrack = cameraTrack?.track?.mediaStreamTrack;
    if (!mediaTrack) {
      const resetFrame = window.requestAnimationFrame(() => {
        setCameraTrackHealthy(false);
      });
      return () => window.cancelAnimationFrame(resetFrame);
    }

    const updateHealth = () => {
      setCameraTrackHealthy(
        mediaTrack.readyState === 'live' &&
          mediaTrack.enabled &&
          !mediaTrack.muted,
      );
    };
    const initialHealthFrame = window.requestAnimationFrame(updateHealth);
    mediaTrack.addEventListener('ended', updateHealth);
    mediaTrack.addEventListener('mute', updateHealth);
    mediaTrack.addEventListener('unmute', updateHealth);
    const healthTimer = window.setInterval(updateHealth, 1000);
    return () => {
      mediaTrack.removeEventListener('ended', updateHealth);
      mediaTrack.removeEventListener('mute', updateHealth);
      mediaTrack.removeEventListener('unmute', updateHealth);
      window.cancelAnimationFrame(initialHealthFrame);
      window.clearInterval(healthTimer);
    };
  }, [cameraTrack]);

  const endSession = () => {
    if (!window.confirm('Are you sure you want to end this interview?')) return;

    setSessionPhase('ended');
    room.disconnect();
    if (onExit) onExit();
  };

  const isLive = connectionState === ConnectionState.Connected;
  const botIsSpeaking = agentState === 'speaking';
  const botIsProcessing = agentState === 'thinking';
  const micIsPublished =
    Boolean(microphoneTrack) && isMicrophoneEnabled && !micMutedByUser;
  const cameraIsPublished =
    Boolean(cameraTrack) && isCameraEnabled && cameraTrackHealthy;
  const agentIsReady = Boolean(agent) && agentState !== 'connecting' && agentState !== 'disconnected';
  const isRecording = isLive && micIsPublished && agentState === 'listening';
  const displayedMicError = micError || lastMicrophoneError?.message || null;
  const displayedCameraError = cameraError || lastCameraError?.message || null;

  const publishTabSwitchEvent = useCallback(
    async (event: { event_id: string; occurred_at: string }) => {
      if (connectionState !== ConnectionState.Connected) return;
      const payload = new TextEncoder().encode(
        JSON.stringify({ type: TAB_SWITCH_EVENT, ...event }),
      );
      try {
        await localParticipant.publishData(payload, {
          reliable: true,
          topic: INTERVIEW_PROCTORING_TOPIC,
        });
      } catch (err) {
        console.warn('Unable to report interview tab switch', err);
      }
    },
    [connectionState, localParticipant],
  );

  const flushPendingTabSwitches = useCallback(() => {
    for (const event of pendingTabSwitchesRef.current.values()) {
      void publishTabSwitchEvent(event);
    }
  }, [publishTabSwitchEvent]);

  const publishFaceProctoringEvent = useCallback(
    async (event: FaceProctoringViolationEvent) => {
      if (connectionState !== ConnectionState.Connected) return;
      const payload = new TextEncoder().encode(JSON.stringify(event));
      try {
        await localParticipant.publishData(payload, {
          reliable: true,
          topic: INTERVIEW_PROCTORING_TOPIC,
        });
      } catch (err) {
        console.warn('Unable to report face proctoring event', err);
      }
    },
    [connectionState, localParticipant],
  );

  const handleFaceViolation = useCallback(
    (event: FaceProctoringViolationEvent) => {
      pendingFaceEventsRef.current.set(event.event_id, event);
      void publishFaceProctoringEvent(event);
    },
    [publishFaceProctoringEvent],
  );

  const flushPendingFaceEvents = useCallback(() => {
    for (const event of pendingFaceEventsRef.current.values()) {
      void publishFaceProctoringEvent(event);
    }
  }, [publishFaceProctoringEvent]);

  const faceProctoring = useFaceProctoring({
    enabled:
      FACE_PROCTORING_ENABLED && isLive && sessionPhase === 'active',
    cameraAvailable: cameraIsPublished,
    videoRef: candidateVideoRef,
    onViolation: handleFaceViolation,
  });
  const faceMonitoringIsActive =
    FACE_PROCTORING_ENABLED &&
    isLive &&
    sessionPhase === 'active' &&
    faceProctoring.status === 'ready';
  const faceMonitoringIsStarting =
    FACE_PROCTORING_ENABLED &&
    isLive &&
    sessionPhase === 'active' &&
    faceProctoring.status === 'starting';
  const faceMonitoringIsUnavailable =
    FACE_PROCTORING_ENABLED &&
    isLive &&
    sessionPhase === 'active' &&
    faceProctoring.status === 'unavailable';

  useEffect(() => {
    if (sessionPhase !== 'active') {
      return;
    }

    const reportTabSwitch = () => {
      const previousVisibility = lastVisibilityStateRef.current;
      lastVisibilityStateRef.current = document.visibilityState;
      if (
        document.visibilityState !== 'hidden' ||
        previousVisibility === 'hidden' ||
        closingSignalReceivedRef.current ||
        terminationSignalReceivedRef.current
      ) {
        return;
      }

      const event = {
        event_id: window.crypto.randomUUID(),
        occurred_at: new Date().toISOString(),
      };
      pendingTabSwitchesRef.current.set(event.event_id, event);
      setTabSwitchCount((current) => current + 1);
      void publishTabSwitchEvent(event);
    };

    document.addEventListener('visibilitychange', reportTabSwitch);
    return () => document.removeEventListener('visibilitychange', reportTabSwitch);
  }, [publishTabSwitchEvent, sessionPhase]);

  useEffect(() => {
    if (
      connectionState !== ConnectionState.Connected ||
      sessionPhase !== 'active'
    ) {
      return;
    }
    flushPendingTabSwitches();
    const retryTimer = window.setInterval(flushPendingTabSwitches, 2000);
    return () => window.clearInterval(retryTimer);
  }, [connectionState, flushPendingTabSwitches, sessionPhase]);

  useEffect(() => {
    if (
      connectionState !== ConnectionState.Connected ||
      sessionPhase !== 'active'
    ) {
      return;
    }
    flushPendingFaceEvents();
    const retryTimer = window.setInterval(flushPendingFaceEvents, 2000);
    return () => window.clearInterval(retryTimer);
  }, [connectionState, flushPendingFaceEvents, sessionPhase]);

  const readinessText = (() => {
    if (connectionState === ConnectionState.Connecting) return 'Connecting to LiveKit';
    if (!isLive) return 'Connection closed';
    if (!agent) return 'Starting interviewer';
    if (!agentIsReady) return 'Preparing interviewer';
    if (!micIsPublished) {
      if (micMutedByUser) return 'Microphone muted';
      return 'Connecting microphone';
    }
    if (agentState === 'speaking') return 'iBot is speaking';
    if (agentState === 'thinking') return 'Processing your response';
    return 'Ready for your response';
  })();

  const notifyCompletion = useCallback(() => {
    if (hasCompletionNotifiedRef.current) return;
    hasCompletionNotifiedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  const finalizeAsComplete = useCallback(() => {
    setSessionPhase('complete');
    notifyCompletion();
  }, [notifyCompletion]);

  const finalizeAsEnded = useCallback(() => {
    setSessionPhase('ended');
  }, []);

  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      hasConnectedRef.current = true;
    }
  }, [connectionState]);

  useEffect(() => {
    if (timerStartedAtMs !== null || !isLive || !agentIsReady) return;

    const frame = window.requestAnimationFrame(() => {
      setTimerStartedAtMs(Date.now());
    });

    return () => window.cancelAnimationFrame(frame);
  }, [agentIsReady, isLive, timerStartedAtMs]);

  useEffect(() => {
    if (!closingSignalReceived || botIsSpeaking || sessionPhase !== 'active') return;

    const closeTimer = window.setTimeout(() => {
      if (
        !hasAutoDisconnectedRef.current &&
        connectionState !== ConnectionState.Disconnected
      ) {
        hasAutoDisconnectedRef.current = true;
        room.disconnect();
      }
      finalizeAsComplete();
    }, 400);

    return () => window.clearTimeout(closeTimer);
  }, [botIsSpeaking, closingSignalReceived, connectionState, finalizeAsComplete, room, sessionPhase]);

  useEffect(() => {
    if (
      connectionState !== ConnectionState.Disconnected ||
      !hasConnectedRef.current ||
      sessionPhase !== 'active'
    ) {
      return;
    }

    const finalizeTimer = window.setTimeout(() => {
      if (closingSignalReceived) {
        finalizeAsComplete();
        return;
      }

      if (terminationSignalReceivedRef.current) {
        setSessionPhase('terminated');
        return;
      }

      finalizeAsEnded();
    }, 0);

    return () => window.clearTimeout(finalizeTimer);
  }, [closingSignalReceived, connectionState, finalizeAsComplete, finalizeAsEnded, sessionPhase]);

  let statusStr: 'idle' | 'connecting' | 'connected' | 'complete' | 'error' | 'closed' = 'idle';
  if (sessionPhase === 'complete') statusStr = 'complete';
  else if (sessionPhase === 'terminated' || sessionPhase === 'ended') statusStr = 'closed';
  else if (connectionState === ConnectionState.Connected && agentIsReady) statusStr = 'connected';
  else if (connectionState === ConnectionState.Connected) statusStr = 'connecting';
  else if (connectionState === ConnectionState.Connecting) statusStr = 'connecting';
  else if (connectionState === ConnectionState.Disconnected) statusStr = 'closed';

  return (
    <div className="ibot-candidate-shell ibot-interview-room-bg relative isolate flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden text-[#1F1D1A]">
      <div className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full bg-brand-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#D7AA6A]/10 blur-3xl" />

      <header className="z-20 flex min-h-[70px] items-center justify-between gap-2 border-b border-[#E6DED2] bg-white/90 px-3 py-3 shadow-sm shadow-[#1F1D1A]/5 backdrop-blur-xl sm:gap-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-3">
            <IbotMark />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-black text-[#1F1D1A]">AI Interview</p>
              <p className="truncate text-[9px] font-black uppercase tracking-[0.15em] text-brand-hover">Live interview room</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {(interviewStarted || timerStartedAtMs !== null) && sessionPhase === 'active' && (
            <InterviewTimer
              durationMins={durationMins}
              initialElapsedSecs={initialElapsedSecs}
              runningSinceMs={timerStartedAtMs}
              isRunning={isLive}
            />
          )}
          <StatusPill status={statusStr} isBotSpeaking={botIsSpeaking} />
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1.5 text-[10px] font-black sm:gap-1.5 sm:px-3 ${
              tabSwitchCount > 0
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
            title="Tab switches recorded. The 5th switch will end the interview."
            aria-label={`${tabSwitchCount} tab switches recorded; the 5th ends the interview`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tabs</span>
            {tabSwitchCount}/5
          </span>
          {isRecording && (
            <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 sm:inline-flex">
              <AudioLines className="h-3.5 w-3.5" />
              Listening
            </span>
          )}
          {isLive && !micIsPublished && !micMutedByUser && (
            <span
              className="hidden items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-700 sm:inline-flex"
              title={displayedMicError || 'Publishing microphone'}
            >
              <Mic className="h-3.5 w-3.5" />
              Mic connecting
            </span>
          )}
          {isLive && micMutedByUser && sessionPhase === 'active' && (
            <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600 sm:inline-flex">
              <MicOff className="h-3.5 w-3.5" />
              Muted
            </span>
          )}
        </div>
      </header>

      <main className="ibot-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto p-3 pb-24 sm:p-5 sm:pb-24 xl:overflow-hidden">
        <div className="mx-auto grid h-auto min-h-0 w-full max-w-[1680px] grid-cols-1 gap-4 xl:h-full xl:grid-cols-[minmax(420px,0.88fr)_minmax(560px,1.12fr)]">
          <div className="grid min-h-0 gap-4 xl:grid-rows-2">
          <section className="ibot-stage-panel relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-[#E6DED2] p-4 shadow-[0_18px_46px_-34px_rgba(36,33,29,0.35)] xl:min-h-0">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/70 to-transparent" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent/10 blur-3xl" />

            {sessionPhase === 'active' ? (
              <div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-center">
                <Ibot3DAvatar isSpeaking={botIsSpeaking} compact />

                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/90 bg-white/90 px-5 py-3 shadow-lg shadow-[#1F1D1A]/5 ring-1 ring-[#E6DED2] backdrop-blur-xl">
                  <div className="mb-1.5 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-brand-hover">
                    <span className={`h-2 w-2 rounded-full ${isRecording || botIsSpeaking || botIsProcessing ? 'bg-brand-accent' : 'bg-[#B8AA9A]'}`} />
                    Interviewer status
                  </div>
                  <p className="text-sm font-black text-[#1F1D1A]">{readinessText}</p>
                </div>

                {connectionState === ConnectionState.Connecting && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-black text-slate-600 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />
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
                <CompletionNotice
                  type={
                    sessionPhase === 'complete'
                      ? 'complete'
                      : sessionPhase === 'terminated'
                        ? 'terminated'
                        : 'ended'
                  }
                />
                <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
                  {sessionPhase === 'complete'
                    ? 'Your interview has been submitted and the room is now closed.'
                    : sessionPhase === 'terminated'
                      ? terminationMessage(
                          terminationReason,
                          terminationTabSwitchCount,
                        )
                      : 'This interview room is no longer active.'}
                </p>
              </div>
            )}

          </section>

          <section className="relative min-h-[300px] overflow-hidden rounded-3xl border border-[#D8CCBC] bg-brand-charcoal shadow-[0_22px_50px_-34px_rgba(36,33,29,0.75)] xl:min-h-0">
            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/65 to-transparent px-5 pb-8 pt-4 text-white">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#E8C794]">Candidate video</p>
                <p className="mt-0.5 text-xs font-bold">Your camera preview</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {FACE_PROCTORING_ENABLED && isLive && sessionPhase === 'active' && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black ${
                      faceMonitoringIsActive
                        ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100'
                        : faceMonitoringIsUnavailable
                          ? 'border-red-300/50 bg-red-500/25 text-red-50'
                          : 'border-amber-300/40 bg-amber-500/20 text-amber-50'
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        faceMonitoringIsActive
                          ? 'bg-emerald-400'
                          : faceMonitoringIsUnavailable
                            ? 'bg-red-400'
                            : 'animate-pulse bg-amber-300'
                      }`}
                    />
                    {faceMonitoringIsActive
                      ? 'Face monitoring active'
                      : faceMonitoringIsStarting
                        ? 'Face monitoring starting'
                        : 'Face monitoring unavailable'}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black ${
                  cameraIsPublished
                    ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100'
                    : 'border-white/20 bg-white/10 text-white/75'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cameraIsPublished ? 'bg-emerald-400' : 'bg-white/45'}`} />
                  {cameraIsPublished ? 'Camera required · on' : 'Camera required · off'}
                </span>
              </div>
            </div>

            {cameraIsPublished && cameraTrack ? (
              <VideoTrack
                ref={candidateVideoRef}
                trackRef={{
                  participant: localParticipant,
                  publication: cameraTrack,
                  source: Track.Source.Camera,
                }}
                className="h-full w-full scale-x-[-1] object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(185,131,63,0.2),transparent_38%)] px-8 text-center text-white">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#E8C794]">
                  <VideoOff className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-black">Candidate cannot be seen</p>
                <p className="mt-1 max-w-xs text-[11px] font-medium leading-relaxed text-white/55">
                  Video must remain on throughout the interview. Absence is a high-severity violation, and 30 continuous seconds without a visible face will end the interview.
                </p>
                <button
                  type="button"
                  onClick={() => void recoverCamera()}
                  disabled={isCameraRecovering || !isLive}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCameraRecovering && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isCameraRecovering ? 'Restoring camera' : 'Restore camera'}
                </button>
              </div>
            )}

            {faceMonitoringIsUnavailable && (
              <div
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#17130F]/95 px-8 text-center text-white backdrop-blur-sm"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-300/25 bg-red-500/15 text-red-200">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-black">Face monitoring is unavailable</p>
                <p className="mt-1 max-w-sm text-[11px] font-medium leading-relaxed text-white/65">
                  The interview cannot continue without active face monitoring. Refresh the room to reconnect monitoring.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[10px] font-black text-brand-charcoal transition hover:bg-brand-soft"
                >
                  Refresh interview room
                </button>
              </div>
            )}

            {faceProctoring.alertCondition && cameraIsPublished && !faceMonitoringIsUnavailable && (
              <div
                className={`absolute inset-x-4 bottom-4 z-20 rounded-xl border px-4 py-3 text-xs font-black shadow-xl backdrop-blur ${
                  faceProctoring.alertCondition === 'multiple_faces'
                    ? 'border-orange-300/50 bg-orange-950/90 text-orange-50'
                    : 'border-amber-300/50 bg-amber-950/90 text-amber-50'
                }`}
                role="alert"
                aria-live="assertive"
              >
                {faceProctoring.alertCondition === 'multiple_faces'
                  ? 'Only one person should attend the interview. This is a high-severity violation; 20 continuous seconds will end the interview.'
                  : 'Candidate cannot be seen. This is a high-severity violation; remain visible to avoid termination after 30 continuous seconds.'}
              </div>
            )}

            {displayedCameraError && !faceProctoring.alertCondition && !faceMonitoringIsUnavailable && (
              <div className="absolute inset-x-4 bottom-4 z-20 rounded-xl border border-amber-300/35 bg-[#2F2922]/90 px-3 py-2.5 text-[10px] font-semibold text-amber-100 backdrop-blur">
                Camera issue: {displayedCameraError}
              </div>
            )}
          </section>
          </div>

          <section className="ibot-caption-panel flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-[#E6DED2] bg-white/92 shadow-[0_22px_54px_-38px_rgba(36,33,29,0.45)] backdrop-blur-xl xl:min-h-0">
            <div className="flex items-center justify-between gap-3 border-b border-[#E6DED2] bg-white/65 px-6 py-4 backdrop-blur">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-brand-hover">Live conversation</p>
                <h2 className="mt-1 font-display text-base font-black text-[#1F1D1A]">Interview transcript</h2>
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
              ) : botIsSpeaking ? (
                <span className="rounded-full border border-[#E6DED2] bg-white px-3 py-1.5 text-[10px] font-black text-[#706A61]">
                  Interviewer speaking
                </span>
              ) : botIsProcessing ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-700">
                  Processing
                </span>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 p-5">
              <LiveTranscriptPanel
                isBotSpeaking={botIsSpeaking}
                onClosingMessage={signalInterviewClosing}
              />
            </div>
          </section>
        </div>
      </main>

      {isLive && sessionPhase === 'active' && (
        <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2">
          <InterviewControlDock
            isMuted={micMutedByUser}
            isMicToggling={isMicToggling}
            onToggleMicrophone={toggleMicrophone}
            onEndSession={endSession}
          />
        </div>
      )}
    </div>
  );
}
