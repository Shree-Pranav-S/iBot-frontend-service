import { useCallback, useState } from 'react';
import {
  useGenerateDecisionFeedback,
  useUpdateCandidateDecision,
} from '../../../hooks/queries';
import { useToast } from '../../../hooks/useToast';

export type RecruiterDecision = 'APPROVED' | 'REJECTED';

export const isDecisionFinalized = (
  decision: string | null | undefined,
): boolean => decision === 'APPROVED' || decision === 'REJECTED';

export const clampScore = (score: number | null | undefined) =>
  Math.min(10, Math.max(0, Number(score) || 0));

export const formatLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const candidateInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'C';

export const scoreTextClass = (score: number) => {
  const value = clampScore(score);
  if (value >= 7.5) return 'text-emerald-700';
  if (value >= 5.5) return 'text-brand-hover';
  if (value >= 4) return 'text-amber-700';
  return 'text-rose-700';
};

export const scoreFillClass = (score: number) => {
  const value = clampScore(score);
  if (value >= 7.5) return 'bg-emerald-500';
  if (value >= 5.5) return 'bg-brand-accent';
  if (value >= 4) return 'bg-amber-500';
  return 'bg-rose-500';
};

export const scoreLabel = (score: number) => {
  const value = clampScore(score);
  if (value >= 8.5) return 'Exceptional';
  if (value >= 7.5) return 'Strong';
  if (value >= 5.5) return 'Adequate';
  if (value >= 4) return 'Developing';
  return 'Weak';
};

export const recommendationMeta = (recommendation: string) => {
  switch (recommendation.toLowerCase()) {
    case 'hire':
      return {
        label: 'Hire',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'consider':
      return {
        label: 'Consider',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
        dot: 'bg-amber-500',
      };
    default:
      return {
        label: 'No hire',
        className: 'border-rose-200 bg-rose-50 text-rose-800',
        dot: 'bg-rose-500',
      };
  }
};

export const decisionMeta = (decision: string | null | undefined) => {
  if (decision === 'APPROVED') {
    return {
      label: 'Hired',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      dot: 'bg-emerald-500',
    };
  }
  if (decision === 'REJECTED') {
    return {
      label: 'Rejected',
      className: 'border-rose-200 bg-rose-50 text-rose-800',
      dot: 'bg-rose-500',
    };
  }
  return {
    label: 'Decision pending',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    dot: 'bg-amber-500',
  };
};

const SKILL_LABEL =
  /^[A-Z][A-Za-z0-9/_-]+(?:\/[A-Za-z][A-Za-z0-9/_-]+)?\b/;

const SKILL_HIGHLIGHT_SENTENCE =
  /^(?:[A-Z][A-Za-z0-9/_-]+(?:\/[A-Za-z][A-Za-z0-9/_-]+)?)\s*(?:—|-|with\b|reveals\b|is\b|shows\b|scores?\b|demonstrates\b)/i;

const SENTENCE_SPLIT = /(?<=[.!?])\s+/;

export const cleanRecruiterNarrative = (text: string | null | undefined): string => {
  if (!text) return '';

  let value = text.replace(/\s*Deterministic override:.*$/im, '').trim();

  value = value
    .replace(/\(priority\s*[\d.]+\)/gi, '')
    .replace(/\bhighest-priority\s+/gi, '')
    .replace(/\blow priority\b/gi, '')
    .replace(/Weighted technical aggregate\s*~?[\d.]+\s*/gi, '')
    .replace(/\bexceeds its\s+/gi, '');

  value = value.replace(
    /\b([A-Za-z][A-Za-z0-9/_-]*(?:\/[A-Za-z][A-Za-z0-9/_-]*)?)\s*\([\d.]+\)\s*scores?\s*[\d.]+\s*/gi,
    '$1 — ',
  );

  value = value.replace(
    /\b([A-Za-z][A-Za-z0-9/_-]*(?:\/[A-Za-z][A-Za-z0-9/_-]*)?)\s*\([\d.]+\)\s*at\s*[\d.]+\s*/gi,
    '$1 — ',
  );

  value = value
    .replace(/\s*\([\d.]+\)/g, '')
    .replace(/\bscores?\s+[\d.]+(?:\/10)?\b/gi, '')
    .replace(/\bat\s+[\d.]+(?:\/10)?\b/gi, '')
    .replace(/\bis strong at\s+[\d.]+\b/gi, 'is strong')
    .replace(/\s+—\s+/g, ' — ')
    .replace(/\s+([,;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .trim();

  return value;
};

export type RecruiterNarrativeBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'bullets'; items: string[] };

const isSkillHighlightSentence = (sentence: string): boolean => {
  if (/^(?:Behavioural|Communication)\b/i.test(sentence)) return true;
  if (!SKILL_LABEL.test(sentence)) return false;
  return SKILL_HIGHLIGHT_SENTENCE.test(sentence);
};

export const buildRecruiterNarrativeBlocks = (
  text: string | null | undefined,
): RecruiterNarrativeBlock[] => {
  const cleaned = cleanRecruiterNarrative(text);
  if (!cleaned) return [];

  const sentences = cleaned.split(SENTENCE_SPLIT).map((part) => part.trim()).filter(Boolean);
  const blocks: RecruiterNarrativeBlock[] = [];
  let paragraphBuffer: string[] = [];
  let bulletBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    blocks.push({ type: 'paragraph', content: paragraphBuffer.join(' ') });
    paragraphBuffer = [];
  };

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    blocks.push({ type: 'bullets', items: [...bulletBuffer] });
    bulletBuffer = [];
  };

  for (const sentence of sentences) {
    if (isSkillHighlightSentence(sentence)) {
      flushParagraph();
      bulletBuffer.push(sentence);
      continue;
    }
    flushBullets();
    paragraphBuffer.push(sentence);
  }

  flushParagraph();
  flushBullets();
  return blocks;
};

export const useEvaluationDecision = () => {
  const { mutateAsync, isPending } = useUpdateCandidateDecision();
  const {
    mutateAsync: generateFeedbackMutation,
    isPending: isGeneratingFeedback,
  } = useGenerateDecisionFeedback();
  const { success, error: showError } = useToast();
  const [modal, setModal] = useState<{
    open: boolean;
    candidateId: string;
    candidateName: string;
    currentDecision: string;
    decision: RecruiterDecision;
  }>({
    open: false,
    candidateId: '',
    candidateName: '',
    currentDecision: 'PENDING',
    decision: 'APPROVED',
  });

  const requestDecision = useCallback(
    (
      candidateId: string,
      candidateName: string,
      currentDecision: string,
      decision: RecruiterDecision,
    ) => {
      if (isDecisionFinalized(currentDecision)) return;
      setModal({
        open: true,
        candidateId,
        candidateName,
        currentDecision,
        decision,
      });
    },
    [],
  );

  const closeDecision = useCallback(
    () => setModal((current) => ({ ...current, open: false })),
    [],
  );

  const saveDecision = useCallback(
    async (feedback?: string) => {
      try {
        await mutateAsync({
          candidateId: modal.candidateId,
          decision: modal.decision,
          feedback,
        });
        success(
          'Decision saved',
          `${modal.candidateName} has been ${
            modal.decision === 'APPROVED' ? 'hired' : 'rejected'
          }.`,
        );
        closeDecision();
      } catch (error: unknown) {
        showError(
          'Unable to save decision',
          error instanceof Error ? error.message : 'Please try again.',
        );
      }
    },
    [closeDecision, modal, mutateAsync, showError, success],
  );

  const generateFeedback = useCallback(async () => {
    try {
      const result = await generateFeedbackMutation({
        candidateId: modal.candidateId,
        decision: modal.decision,
      });
      return result.feedback;
    } catch (error: unknown) {
      showError(
        'Unable to draft feedback',
        error instanceof Error ? error.message : 'Please try again.',
      );
      return undefined;
    }
  }, [generateFeedbackMutation, modal.candidateId, modal.decision, showError]);

  return {
    modal,
    requestDecision,
    closeDecision,
    saveDecision,
    generateFeedback,
    isSaving: isPending,
    isGeneratingFeedback,
  };
};
