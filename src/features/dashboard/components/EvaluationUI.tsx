import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import {
  buildRecruiterNarrativeBlocks,
  clampScore,
  scoreFillClass,
  scoreTextClass,
} from './evaluationUiUtils';
import type { RecruiterDecision } from './evaluationUiUtils';

interface CenteredDialogProps {
  open?: boolean;
  children: React.ReactNode;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  closeDisabled?: boolean;
}

export const CenteredDialog: React.FC<CenteredDialogProps> = ({
  open = true,
  children,
  onClose,
  labelledBy,
  className = '',
  closeDisabled = false,
}) => {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeDisabled) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeDisabled, onClose, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="ibot-overlay print:hidden !z-[100] !items-center !justify-center !overflow-hidden !p-2 sm:!p-4"
      role="presentation"
      onMouseDown={closeDisabled ? undefined : onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`ibot-modal mx-auto max-h-[calc(100dvh-2rem)] ${className}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>,
    document.body,
  );
};

export const RecruiterNarrativeContent: React.FC<{
  text: string;
  paragraphClassName?: string;
  bulletClassName?: string;
}> = ({
  text,
  paragraphClassName = 'text-[13px] font-medium leading-7 text-slate-600',
  bulletClassName = 'text-[12px] font-medium leading-6 text-slate-600',
}) => {
  const blocks = buildRecruiterNarrativeBlocks(text);
  if (blocks.length === 0) {
    return <p className={paragraphClassName}>No summary available.</p>;
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) =>
        block.type === 'paragraph' ? (
          <p key={`paragraph-${index}`} className={paragraphClassName}>
            {block.content}
          </p>
        ) : (
          <ul key={`bullets-${index}`} className="space-y-2 border-l-2 border-[#D7C2A8] pl-3.5">
            {block.items.map((item, itemIndex) => (
              <li key={`bullet-${index}-${itemIndex}`} className={bulletClassName}>
                {item}
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
};

export const StatusPill: React.FC<{
  label: string;
  className: string;
  dot?: string;
}> = ({ label, className, dot }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-extrabold tracking-[0.02em] ${className}`}
  >
    {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
    {label}
  </span>
);

export const ScoreRing: React.FC<{
  score: number;
  size?: number;
  label?: string;
}> = ({ score, size = 148, label = 'Overall score' }) => {
  const value = clampScore(score);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 10) * circumference;
  const stroke =
    value >= 7.5
      ? '#10b981'
      : value >= 5.5
        ? '#B9833F'
        : value >= 4
          ? '#f59e0b'
          : '#f43f5e';

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg
        className="-rotate-90 drop-shadow-sm"
        viewBox="0 0 112 112"
        role="img"
        aria-label={`${label}: ${value.toFixed(1)} out of 10`}
      >
        <circle cx="56" cy="56" r={radius} fill="none" stroke="#E6DED2" strokeWidth="8" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute text-center">
        <p className={`font-display text-4xl font-black tracking-tight ${scoreTextClass(value)}`}>
          {value.toFixed(1)}
        </p>
        <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
          out of 10
        </p>
      </div>
    </div>
  );
};

export const ScoreBar: React.FC<{
  score: number;
  label?: string;
  compact?: boolean;
}> = ({ score, label, compact = false }) => {
  const value = clampScore(score);
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="truncate text-[11px] font-bold text-slate-700">{label}</span>
          <span className={`text-[11px] font-black ${scoreTextClass(value)}`}>
            {value.toFixed(1)}
          </span>
        </div>
      )}
      <div
        className={`relative overflow-hidden rounded-full bg-slate-100 ${compact ? 'h-1.5' : 'h-2.5'}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${scoreFillClass(value)}`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
};

type RadarPoint = { label: string; score: number };

export const CompetencyRadar: React.FC<{ points: RadarPoint[] }> = ({ points }) => {
  const normalized = points.slice(0, 6).map((point) => ({
    ...point,
    score: clampScore(point.score),
  }));
  const count = Math.max(3, normalized.length);
  // Use a wider viewBox with extra horizontal padding so long labels don't clip
  const vbW = 300;
  const vbH = 270;
  const center = { x: 150, y: 140 };
  const radius = 88;

  const coordinates = (scale: number) =>
    Array.from({ length: count }, (_, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
      return {
        x: center.x + Math.cos(angle) * radius * scale,
        y: center.y + Math.sin(angle) * radius * scale,
      };
    });
  const polygon = (coords: Array<{ x: number; y: number }>) =>
    coords.map(({ x, y }) => `${x},${y}`).join(' ');
  const dataCoordinates = coordinates(1).map((pt, index) => {
    const score = normalized[index]?.score ?? 0;
    return {
      x: center.x + (pt.x - center.x) * (score / 10),
      y: center.y + (pt.y - center.y) * (score / 10),
    };
  });
  // Labels placed at 1.28 scale so they have breathing room from the data polygon
  const labelPositions = coordinates(1.28);

  if (normalized.length < 3) return null;

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      className="mx-auto h-full min-h-[220px] w-full max-w-[340px]"
      role="img"
      aria-label="Competency radar chart"
    >
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={polygon(coordinates(scale))}
          fill={scale === 1 ? '#FCFAF6' : 'none'}
          stroke="#E6DED2"
          strokeWidth="1"
        />
      ))}
      {coordinates(1).map((pt, index) => (
        <line
          key={index}
          x1={center.x}
          y1={center.y}
          x2={pt.x}
          y2={pt.y}
          stroke="#E6DED2"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={polygon(dataCoordinates)}
        fill="rgba(185, 131, 63, 0.18)"
        stroke="#B9833F"
        strokeWidth="2.5"
      />
      {dataCoordinates.map((pt, index) => (
        <circle
          key={index}
          cx={pt.x}
          cy={pt.y}
          r="4"
          fill="#ffffff"
          stroke="#B9833F"
          strokeWidth="2.5"
        />
      ))}
      {labelPositions.map((pt, index) => {
        const item = normalized[index];
        if (!item) return null;
        const dx = pt.x - center.x;
        const anchor = dx < -4 ? 'end' : dx > 4 ? 'start' : 'middle';
        return (
          <g key={item.label}>
            <text
              x={pt.x}
              y={pt.y - 2}
              textAnchor={anchor}
              fontSize="9"
              fontWeight="600"
              fill="#706A61"
            >
              {item.label}
            </text>
            <text
              x={pt.x}
              y={pt.y + 11}
              textAnchor={anchor}
              fontSize="10"
              fontWeight="700"
              fill="#1F1D1A"
            >
              {item.score.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

interface DecisionModalProps {
  open: boolean;
  candidateName: string;
  currentDecision?: string | null;
  decision: RecruiterDecision;
  loading: boolean;
  generatingFeedback: boolean;
  onClose: () => void;
  onConfirm: (feedback?: string) => Promise<void>;
  onGenerateFeedback: () => Promise<string | undefined>;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  open,
  candidateName,
  decision,
  loading,
  generatingFeedback,
  onClose,
  onConfirm,
  onGenerateFeedback,
}) => {
  const [feedback, setFeedback] = useState('');
  const isApproval = decision === 'APPROVED';
  const handleGenerateFeedback = async () => {
    const draft = await onGenerateFeedback();
    if (draft) setFeedback(draft.slice(0, 2000));
  };

  return (
    <CenteredDialog
      open={open}
      onClose={onClose}
      labelledBy="decision-dialog-title"
      closeDisabled={loading}
      className="max-w-xl"
    >
        <div
          className={`h-1.5 w-full ${
            isApproval
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-700'
              : 'bg-gradient-to-r from-rose-500 to-amber-400'
          }`}
        />
        <div className="ibot-scrollbar min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  isApproval
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                }`}
              >
                {isApproval ? <UserCheck className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Recruiter decision
                </p>
                <h2 id="decision-dialog-title" className="mt-1 text-xl font-black text-slate-950">
                  {isApproval ? 'Hire candidate' : 'Reject candidate'}
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">{candidateName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              aria-label="Close decision dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-slate-700">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="text-xs font-semibold leading-relaxed">
              This decision is saved to the candidate record and queues the corresponding candidate notification.
            </p>
          </div>

          <label className="mt-5 block">
            <span className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-800">
                {isApproval ? 'Candidate message' : 'Candidate feedback'}
                <span className="ml-1 font-semibold text-slate-400">(optional)</span>
              </span>
              <button
                  type="button"
                  onClick={handleGenerateFeedback}
                  disabled={loading || generatingFeedback}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-default bg-brand-soft px-2.5 py-1.5 text-[10px] font-black text-brand-hover transition-all hover:-translate-y-0.5 hover:border-brand-accent hover:bg-brand-charcoal hover:text-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generatingFeedback ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {generatingFeedback
                    ? 'Drafting…'
                    : feedback.trim()
                      ? 'Regenerate with AI'
                      : 'Draft with AI'}
                </button>
            </span>
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value.slice(0, 2000))}
              rows={4}
              placeholder={
                isApproval
                  ? 'Add a warm message about moving forward and the next steps…'
                  : 'Add constructive feedback that may be included in the rejection email…'
              }
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium leading-relaxed text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-brand-accent focus:ring-4 focus:ring-brand-soft"
            />
            <span className="mt-1.5 block text-right text-[10px] font-bold text-slate-400">
              {feedback.length}/2000
            </span>
            <span className="mt-1 block text-[10px] font-semibold text-slate-400">
              AI drafts use interview evidence and remain fully editable before sending.
            </span>
          </label>
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(feedback.trim() || undefined)}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 ${
              isApproval
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isApproval ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Confirm {isApproval ? 'hire' : 'rejection'}
          </button>
        </footer>
    </CenteredDialog>
  );
};
