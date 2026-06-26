import React, { useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Layers,
  MessageCircle,
  Sparkles,
  User,
  Volume2,
} from 'lucide-react';
import type { ChatMessage } from '../../../types/socket.types';

export const SectionProgress: React.FC<{
  sectionName: string;
  sectionNumber: number;
  totalSections: number;
  skill: string;
}> = ({ sectionName, sectionNumber, totalSections, skill }) => {
  const progress = Math.min(100, Math.max(0, (sectionNumber / totalSections) * 100));

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        <Layers className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-black leading-none text-slate-950">{sectionName}</p>
        <p className="mt-1 truncate text-[10px] font-semibold text-slate-500">
          {sectionNumber}/{totalSections} - {skill.replace(/_/g, ' ')}
        </p>
      </div>
      <div className="hidden w-28 sm:block">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export const StatusPill: React.FC<{ status: string; isBotSpeaking: boolean }> = ({
  status,
  isBotSpeaking,
}) => {
  if (isBotSpeaking) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700 shadow-sm shadow-emerald-900/5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Speaking
      </span>
    );
  }

  const config: Record<string, { color: string; label: string; pulse: boolean; shell: string }> = {
    idle: {
      color: 'bg-slate-400',
      label: 'Idle',
      pulse: false,
      shell: 'border-slate-200 bg-white/90 text-slate-600',
    },
    connecting: {
      color: 'bg-amber-400',
      label: 'Connecting',
      pulse: true,
      shell: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    connected: {
      color: 'bg-emerald-500',
      label: 'Live',
      pulse: true,
      shell: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    complete: {
      color: 'bg-emerald-500',
      label: 'Complete',
      pulse: false,
      shell: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    error: {
      color: 'bg-red-500',
      label: 'Error',
      pulse: false,
      shell: 'border-red-200 bg-red-50 text-red-700',
    },
    closed: {
      color: 'bg-slate-400',
      label: 'Ended',
      pulse: false,
      shell: 'border-slate-200 bg-white/90 text-slate-600',
    },
  };
  const { color, label, pulse, shell } = config[status] ?? config.idle;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black shadow-sm backdrop-blur ${shell}`}>
      <span className={`h-2 w-2 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
};

export const Ibot3DAvatar = React.memo(({ isSpeaking, compact = false }: {
  isSpeaking: boolean;
  compact?: boolean;
}) => (
  <div
    className={`ibot-agent-avatar ${compact ? 'ibot-agent-avatar-sm' : ''} ${
      isSpeaking ? 'is-speaking' : ''
    }`}
    aria-label={isSpeaking ? 'iBot avatar speaking' : 'iBot avatar idle'}
  >
    <div className="ibot-agent-grid" aria-hidden="true" />
    <div className="ibot-agent-ring ring-one" aria-hidden="true" />
    <div className="ibot-agent-ring ring-two" aria-hidden="true" />

    <div className="ibot-agent-core">
      <div className="ibot-agent-device">
        <span className="ibot-agent-led" />
        <div className="ibot-agent-face">
          <span className="ibot-agent-eye eye-left" />
          <span className="ibot-agent-eye eye-right" />
          <span className="ibot-agent-waveform" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((bar) => (
              <i key={bar} style={{ animationDelay: `${bar * 0.08}s` }} />
            ))}
          </span>
        </div>
      </div>
      <div className="ibot-agent-stem" />
      <div className="ibot-agent-base">
        <div className="ibot-agent-chip">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>
    </div>

    <div className="ibot-agent-shadow" aria-hidden="true" />
  </div>
));

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const CaptionCard = React.memo(({
  message,
  isActive = false,
  isBotSpeaking,
  isRecording,
}: {
  message: ChatMessage;
  isActive?: boolean;
  isBotSpeaking: boolean;
  isRecording: boolean;
}) => {
  const isAssistant = message.role === 'assistant';
  const showLiveDots =
    !message.isFinal && (isAssistant ? isBotSpeaking : isRecording);

  return (
    <div
      className={`animate-slideUp rounded-lg border shadow-sm transition-all duration-200 ${
        isActive
          ? isAssistant
            ? 'border-slate-800 bg-slate-950 text-white shadow-xl shadow-slate-900/20'
            : 'border-emerald-200 bg-white text-slate-950 shadow-lg shadow-emerald-900/5'
          : isAssistant
          ? 'border-slate-200 bg-white text-slate-800'
          : 'border-emerald-100 bg-white text-slate-800'
      } ${isActive ? 'p-4' : 'p-3.5'}`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center justify-center rounded-full ${
              isActive ? 'h-8 w-8' : 'h-7 w-7'
            } ${
              isAssistant
                ? isActive
                  ? 'bg-white/10 text-emerald-300'
                  : 'bg-slate-950 text-emerald-300'
                : isActive
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
            }`}
          >
            {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </span>
          <div>
            <p className={`text-xs font-black ${isActive && isAssistant ? 'text-white' : 'text-slate-900'}`}>
              {isAssistant ? 'Interviewer' : 'You'}
            </p>
            <p className={`text-[10px] font-semibold ${isActive && isAssistant ? 'text-white/50' : 'text-slate-400'}`}>
              {formatTime(message.timestamp)}
            </p>
          </div>
          {isActive && isAssistant && isBotSpeaking && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">
              <Volume2 className="h-2.5 w-2.5" />
              Live
            </span>
          )}
        </div>
        {!message.isFinal && (
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${isActive && isAssistant ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-500'}`}>
            Live
          </span>
        )}
      </div>

      <p
        className={`font-medium leading-relaxed ${
          isActive
            ? `text-base ${isAssistant ? 'text-white' : 'text-slate-900'}`
            : 'text-sm text-slate-700'
        }`}
      >
        {message.text}
        {showLiveDots && (
          <span className="ml-2 inline-flex items-center gap-1 align-middle">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400"
                style={{ animationDelay: `${dot * 0.12}s` }}
              />
            ))}
          </span>
        )}
      </p>
    </div>
  );
});

export const TranscriptPanel = React.memo(({
  messages,
  isBotSpeaking,
  isRecording = false,
}: {
  messages: ChatMessage[];
  isBotSpeaking: boolean;
  isRecording?: boolean;
}) => {
  const visibleMessages = messages.filter((message) => message.text?.trim());
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeMessage = visibleMessages[visibleMessages.length - 1];
  const scrollKey = activeMessage
    ? `${activeMessage.id}:${activeMessage.text.length}:${activeMessage.isFinal ? 'final' : 'partial'}`
    : '';

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const frame = window.requestAnimationFrame(() => {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [scrollKey]);

  if (visibleMessages.length === 0) {
    return (
      <div className="flex h-full min-h-[190px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
        <div>
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <MessageCircle className="h-5 w-5" />
          </div>
          <p className="text-sm font-black text-slate-800">Captions will appear here</p>
        </div>
      </div>
    );
  }

  const history = visibleMessages.slice(Math.max(0, visibleMessages.length - 6), -1);

  return (
    <div ref={scrollRef} className="ibot-scrollbar h-full min-h-0 overflow-y-auto pr-1">
      <div className="space-y-3 pb-1">
        {history.map((message) => {
          if (message.role === 'system') {
            return (
              <div key={message.id} className="flex justify-center">
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-semibold text-slate-500 shadow-sm">
                  {message.text}
                </span>
              </div>
            );
          }

          return (
            <CaptionCard
              key={message.id}
              message={message}
              isBotSpeaking={isBotSpeaking}
              isRecording={isRecording}
            />
          );
        })}

        {activeMessage.role === 'system' ? (
          <div className="flex justify-center">
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-semibold text-slate-500 shadow-sm">
              {activeMessage.text}
            </span>
          </div>
        ) : (
          <CaptionCard
            message={activeMessage}
            isActive
            isBotSpeaking={isBotSpeaking}
            isRecording={isRecording}
          />
        )}
      </div>
    </div>
  );
});

export const CompletionNotice: React.FC<{ type: 'complete' | 'terminated' | 'ended' }> = ({
  type,
}) => {
  const copy = {
    complete: ['Interview Complete', 'Your responses are being evaluated'],
    terminated: ['Session Ended', 'The session has been terminated'],
    ended: ['Session ended', ''],
  }[type];

  if (type === 'ended') {
    return (
      <div className="flex justify-center">
        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-semibold text-slate-500 shadow-sm">
          {copy[0]}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-lg border ${
          type === 'complete'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
            : 'border-red-200 bg-red-50 text-red-500'
        }`}
      >
        {type === 'complete' ? (
          <CheckCircle2 className="h-7 w-7" />
        ) : (
          <AlertTriangle className="h-7 w-7" />
        )}
      </div>
      <div>
        <p className="text-sm font-black text-slate-900">{copy[0]}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">{copy[1]}</p>
      </div>
    </div>
  );
};

export const TimerPill = React.memo(({ value }: { value: string }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-sm backdrop-blur">
    <Clock className="h-3.5 w-3.5 text-emerald-600" />
    <span className="font-mono">{value}</span>
  </span>
));
