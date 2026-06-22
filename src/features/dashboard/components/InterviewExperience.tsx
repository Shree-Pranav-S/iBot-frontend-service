import React from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Layers,
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
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        <Layers className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold leading-none text-slate-900">{sectionName}</p>
        <p className="mt-1 truncate text-[10px] font-medium text-slate-500">
          {sectionNumber}/{totalSections} - {skill.replace(/_/g, ' ')}
        </p>
      </div>
      <div className="hidden w-28 sm:block">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-700 ease-out"
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
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 shadow-sm shadow-emerald-100/60">
        <Volume2 className="h-3.5 w-3.5" />
        Speaking
      </span>
    );
  }

  const config: Record<string, { color: string; label: string; pulse: boolean }> = {
    idle: { color: 'bg-slate-400', label: 'Idle', pulse: false },
    connecting: { color: 'bg-amber-400', label: 'Connecting...', pulse: true },
    connected: { color: 'bg-emerald-500', label: 'Live', pulse: true },
    error: { color: 'bg-red-500', label: 'Error', pulse: false },
    closed: { color: 'bg-slate-400', label: 'Ended', pulse: false },
  };
  const { color, label, pulse } = config[status] ?? config.idle;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm backdrop-blur">
      <span className={`h-1.5 w-1.5 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
};

export const Ibot3DAvatar: React.FC<{ isSpeaking: boolean; compact?: boolean }> = ({
  isSpeaking,
  compact = false,
}) => (
  <div
    className={`ibot-avatar-scene ${compact ? 'ibot-avatar-scene-sm' : ''} ${
      isSpeaking ? 'is-speaking' : ''
    }`}
    aria-label={isSpeaking ? 'iBot avatar speaking' : 'iBot avatar idle'}
  >
    <div className="ibot-avatar-orbit orbit-one" />
    <div className="ibot-avatar-orbit orbit-two" />
    <div className="ibot-avatar-floor" />
    <div className="ibot-avatar-bot">
      <div className="ibot-avatar-antenna">
        <span />
      </div>
      <div className="ibot-avatar-head">
        <span className="ibot-avatar-ear ear-left" />
        <span className="ibot-avatar-ear ear-right" />
        <div className="ibot-avatar-face">
          <span className="ibot-avatar-eye eye-left" />
          <span className="ibot-avatar-eye eye-right" />
          <span className="ibot-avatar-smile" />
        </div>
      </div>
      <div className="ibot-avatar-neck" />
      <div className="ibot-avatar-body">
        <span className="ibot-avatar-arm arm-left" />
        <span className="ibot-avatar-arm arm-right" />
        <div className="ibot-avatar-badge">
          <Bot className="h-5 w-5" />
        </div>
      </div>
    </div>
    <div className="ibot-avatar-bars" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((bar) => (
        <span key={bar} style={{ animationDelay: `${bar * 0.08}s` }} />
      ))}
    </div>
  </div>
);

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const TranscriptPanel: React.FC<{
  messages: ChatMessage[];
  isBotSpeaking: boolean;
  isRecording?: boolean;
}> = ({ messages, isBotSpeaking, isRecording = false }) => {
  const visibleMessages = messages.filter((message) => message.text?.trim());

  if (visibleMessages.length === 0) {
    return (
      <div className="flex h-full min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
        <p className="max-w-sm text-sm font-medium text-slate-500">
          Subtitles will appear here once the interview starts.
        </p>
      </div>
    );
  }

  return (
    <div className="ibot-scrollbar h-full min-h-0 space-y-3 overflow-y-auto pr-1">
      {visibleMessages.map((message) => {
        const isAssistant = message.role === 'assistant';
        const isSystem = message.role === 'system';

        if (isSystem) {
          return (
            <div key={message.id} className="flex justify-center">
              <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1 text-[10px] font-semibold text-slate-500 shadow-sm">
                {message.text}
              </span>
            </div>
          );
        }

        return (
          <div
            key={message.id}
            className={`animate-slideUp rounded-2xl border p-4 shadow-sm ${
              isAssistant
                ? 'border-slate-200 bg-white text-slate-800'
                : 'border-emerald-200 bg-emerald-50/80 text-slate-800'
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    isAssistant
                      ? 'bg-slate-900 text-emerald-300'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isAssistant ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </span>
                <span className="text-xs font-black text-slate-900">
                  {isAssistant ? 'iBot' : 'You'}
                </span>
                {isAssistant && isBotSpeaking && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                    <Volume2 className="h-2.5 w-2.5" />
                    Live
                  </span>
                )}
              </div>
              <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                {formatTime(message.timestamp)}
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-700">
              {message.text}
              {!message.isFinal && (
                <span className="ml-2 inline-flex items-center gap-1 align-middle">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className={`h-1.5 w-1.5 rounded-full ${
                        isRecording ? 'bg-emerald-500' : 'bg-slate-400'
                      } animate-bounce`}
                      style={{ animationDelay: `${dot * 0.12}s` }}
                    />
                  ))}
                </span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
};

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
        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500">
          {copy[0]}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
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

export const TimerPill: React.FC<{ value: string }> = ({ value }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur">
    <Clock className="h-3.5 w-3.5 text-emerald-600" />
    <span className="font-mono">{value}</span>
  </span>
);


