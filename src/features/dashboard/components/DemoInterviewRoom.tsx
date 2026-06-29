import React, { useEffect, useState } from 'react';
import '@livekit/components-styles/index.css';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { LIVEKIT_FORCE_RELAY } from '../../../config/livekit';
import {
  AudioLines,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mic,
  PhoneOff,
  Radio,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { useLiveKitDemoToken } from '../hooks/useLiveKitDemoToken';
import {
  Ibot3DAvatar,
  StatusPill,
} from './InterviewExperience';
import { LiveTranscriptPanel } from './InterviewRoom';

interface DemoInterviewRoomProps {
  token: string;
  onExit: () => void;
}

export const DemoInterviewRoom: React.FC<DemoInterviewRoomProps> = ({
  token,
  onExit,
}) => {
  const { data, loading, error, createToken } = useLiveKitDemoToken(token);
  const [connect, setConnect] = useState(false);

  const startDemo = async () => {
    const tokenData = await createToken();
    if (tokenData) setConnect(true);
  };

  if (!data) {
    return (
      <div className="ibot-interview-room-bg fixed inset-0 z-50 flex h-screen w-screen items-center justify-center overflow-hidden p-6 text-slate-900">
        <div className="relative w-full max-w-xl rounded-2xl border border-white/80 bg-white/[0.92] p-8 text-center shadow-2xl shadow-slate-900/10 backdrop-blur-2xl">
          <button
            type="button"
            onClick={onExit}
            className="absolute left-5 top-5 inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl shadow-emerald-500/20">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
            <Radio className="h-3.5 w-3.5" />
            Practice environment
          </div>
          <h1 className="mt-4 font-display text-3xl font-black text-slate-950">
            Try the interview experience
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-relaxed text-slate-600">
            This demo uses the same live voice connection as your interview.
            It does not evaluate your answers, save a transcript, or use AI
            question generation.
          </p>

          <div className="mx-auto mt-5 flex max-w-md items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 text-left">
            <Mic className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <p className="text-xs font-semibold leading-relaxed text-emerald-900">
              Your microphone switches on when you enter and stays on throughout
              this practice session, just like the real interview.
            </p>
          </div>

          {error && (
            <p className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={startDemo}
            disabled={loading}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-8 py-4 text-sm font-black text-white shadow-xl shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening demo...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                Start Demo Interview
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-white">
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
        connectOptions={
          LIVEKIT_FORCE_RELAY
            ? { rtcConfig: { iceTransportPolicy: 'relay' } }
            : undefined
        }
        className="flex h-full flex-col"
      >
        <DemoInterviewStage onExit={onExit} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

function DemoInterviewStage({ onExit }: { onExit: () => void }) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const {
    isMicrophoneEnabled,
    lastMicrophoneError,
    localParticipant,
    microphoneTrack,
  } = useLocalParticipant();
  const { agent, state: agentState } = useVoiceAssistant();
  const [micError, setMicError] = useState<string | null>(null);

  // Demo audio follows the real interview contract: once connected, the
  // microphone is immediately published and automatically re-enabled.
  useEffect(() => {
    if (
      connectionState !== ConnectionState.Connected ||
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
        if (!cancelled) {
          setMicError(
            publication ? null : 'Microphone was not published to the room.',
          );
        }
      })
      .catch((errorValue: unknown) => {
        if (!cancelled) {
          setMicError(
            errorValue instanceof Error
              ? errorValue.message
              : 'Unable to enable microphone.',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connectionState, isMicrophoneEnabled, localParticipant]);

  const exitDemo = () => {
    room.disconnect();
    onExit();
  };

  const isLive = connectionState === ConnectionState.Connected;
  const botIsSpeaking = agentState === 'speaking';
  const botIsProcessing = agentState === 'thinking';
  const micIsPublished = Boolean(microphoneTrack) && isMicrophoneEnabled;
  const isRecording =
    isLive && micIsPublished && agentState === 'listening';
  const displayedMicError = micError || lastMicrophoneError?.message || null;

  let status: 'idle' | 'connecting' | 'connected' | 'error' | 'closed' = 'idle';
  if (connectionState === ConnectionState.Connecting) status = 'connecting';
  else if (connectionState === ConnectionState.Connected && agent) {
    status = 'connected';
  } else if (connectionState === ConnectionState.Connected) {
    status = 'connecting';
  } else if (connectionState === ConnectionState.Disconnected) {
    status = 'closed';
  }

  const statusCopy = (() => {
    if (!isLive) return 'Connecting to the practice room.';
    if (!agent) return 'Preparing the demo interviewer.';
    if (!micIsPublished) return 'Connecting your microphone.';
    if (botIsSpeaking) return 'iBot is speaking.';
    if (botIsProcessing) return 'Preparing a practice response.';
    return 'Your microphone is on. Speak whenever you are ready.';
  })();

  return (
    <div className="ibot-interview-room-bg relative flex h-full min-h-0 w-full flex-col overflow-hidden text-slate-900">
      <header className="z-20 flex min-h-[72px] items-center justify-between gap-4 border-b border-white/80 bg-white/[0.96] px-4 py-3 shadow-sm shadow-slate-200/50 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">
              Demo Interview
            </p>
            <p className="truncate text-[10px] font-black uppercase text-emerald-700">
              Live practice room
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <StatusPill status={status} isBotSpeaking={botIsSpeaking} />
          {micIsPublished && (
            <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 sm:inline-flex">
              <Mic className="h-3.5 w-3.5" />
              Microphone on
            </span>
          )}
          <button
            type="button"
            onClick={exitDemo}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-red-200 bg-white px-3 text-[11px] font-black text-red-500 shadow-sm transition hover:border-red-500 hover:bg-red-500 hover:text-white active:scale-[0.96]"
            title="End demo"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">End Demo</span>
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 p-4 sm:p-5 lg:p-6">
        <div className="mx-auto grid h-full min-h-0 w-full max-w-[1500px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.78fr)]">
          <section className="ibot-stage-panel relative flex min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-lg border border-white/80 p-6 shadow-xl shadow-slate-900/10">
            <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-5 text-center">
              <Ibot3DAvatar isSpeaking={botIsSpeaking} />

              <div className="rounded-lg border border-white/80 bg-white/[0.94] px-5 py-4 shadow-lg shadow-slate-200/60">
                <div className="mb-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-emerald-700">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isRecording || botIsSpeaking || botIsProcessing
                        ? 'animate-pulse bg-emerald-500'
                        : 'bg-slate-300'
                    }`}
                  />
                  Practice status
                </div>
                <p className="text-lg font-black text-slate-950">
                  {statusCopy}
                </p>
                <p className="mx-auto mt-2 max-w-lg text-xs font-semibold leading-relaxed text-slate-500">
                  Nothing you say here is evaluated. The interviewer replies
                  only with randomized practice acknowledgements.
                </p>
              </div>

              {displayedMicError && (
                <div className="max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                  Microphone access is required: {displayedMicError}
                </div>
              )}
            </div>
          </section>

          <section className="ibot-caption-panel flex min-h-[320px] flex-col overflow-hidden rounded-lg border border-white/80 bg-white/[0.92] shadow-xl shadow-slate-900/10">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-700">
                  Practice room
                </p>
                <h2 className="mt-1 text-sm font-black text-slate-950">
                  Live transcript
                </h2>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100">
                  <AudioLines className="h-3.5 w-3.5" />
                  Listening
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 p-4">
              <LiveTranscriptPanel
                localIdentity={localParticipant.identity}
                isBotSpeaking={botIsSpeaking}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
