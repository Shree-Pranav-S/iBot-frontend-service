import React, { useLayoutEffect, useRef } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  MessageCircle,
  Sparkles,
  User,
  Volume2,
} from 'lucide-react';
import type { ChatMessage } from '../../../types/socket.types';

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
}: {
  message: ChatMessage;
  isActive?: boolean;
  isBotSpeaking: boolean;
}) => {
  const isAssistant = message.role === 'assistant';
  const showLiveState = isAssistant && !message.isFinal && isBotSpeaking;

  return (
    <div
      className={`animate-slideUp rounded-2xl border shadow-sm transition-all duration-300 ${
        isActive
          ? isAssistant
            ? 'border-brand-charcoal bg-gradient-to-br from-brand-charcoal via-[#302B25] to-[#4A3520] text-white shadow-xl shadow-black/15'
            : 'border-[#D9C4A7] bg-gradient-to-br from-white to-brand-soft/70 text-[#1F1D1A] shadow-lg shadow-brand-accent/5'
          : isAssistant
          ? 'border-[#E6DED2] bg-white/90 text-[#1F1D1A]'
          : 'border-[#E6DED2] bg-brand-soft/35 text-[#1F1D1A]'
      } ${isActive ? 'p-4' : 'p-3.5'} ${isAssistant ? 'mr-4' : 'ml-4'}`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center justify-center rounded-full ${
              isActive ? 'h-8 w-8' : 'h-7 w-7'
            } ${
              isAssistant
                ? isActive
                  ? 'bg-white/10 text-[#E8C794]'
                  : 'bg-brand-charcoal text-[#E8C794]'
                : isActive
                ? 'bg-brand-accent text-white'
                : 'bg-brand-soft text-brand-hover ring-1 ring-[#D9C4A7]'
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
          {isActive && showLiveState && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[9px] font-black text-brand-hover">
              <Volume2 className="h-2.5 w-2.5" />
              Live
            </span>
          )}
        </div>
        {showLiveState && (
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
        {showLiveState && (
          <span className="ml-2 inline-flex items-center gap-1 align-middle">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D7AA6A]"
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
}: {
  messages: ChatMessage[];
  isBotSpeaking: boolean;
}) => {
  const visibleMessages = messages.filter((message) => message.text?.trim());
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeMessage = visibleMessages[visibleMessages.length - 1];
  const scrollKey = activeMessage
    ? `${activeMessage.id}:${activeMessage.text}:${activeMessage.isFinal ? 'final' : 'partial'}`
    : '';

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const frame = window.requestAnimationFrame(() => {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [scrollKey]);

  if (visibleMessages.length === 0) {
    return (
      <div className="flex h-full min-h-[190px] items-center justify-center rounded-2xl border border-dashed border-[#D9C4A7] bg-gradient-to-br from-white to-brand-soft/40 p-8 text-center shadow-inner shadow-[#E6DED2]/60">
        <div>
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-hover ring-1 ring-[#D9C4A7]">
            <MessageCircle className="h-5 w-5" />
          </div>
          <p className="text-sm font-black text-[#1F1D1A]">Captions will appear here</p>
        </div>
      </div>
    );
  }

  const history = visibleMessages.slice(Math.max(0, visibleMessages.length - 6), -1);

  return (
    <div ref={scrollRef} className="ibot-scrollbar h-full min-h-0 overflow-y-auto pr-1 [overflow-anchor:none]">
      <div className="space-y-3 pb-2" aria-live="polite" aria-relevant="additions text">
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
  <span className="inline-flex items-center gap-2 rounded-full border border-brand-charcoal bg-brand-charcoal px-3 py-1.5 text-[11px] font-black text-white shadow-lg shadow-black/10">
    <Clock className="h-3.5 w-3.5 text-[#E8C794]" />
    <span className="font-mono tabular-nums tracking-wide">{value}</span>
  </span>
));
