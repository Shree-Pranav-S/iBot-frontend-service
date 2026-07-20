import type { ViolationCategoryDetail } from '../../../types/candidate.types';
import { formatDateTime, formatLabel } from './evaluationUiUtils';

export interface ViolationCategoryFact {
  label: string;
  value: string;
}

export interface ViolationCategoryPresentation {
  label: string;
  severityLabel: string;
  occurredAt: string;
  facts: ViolationCategoryFact[];
  scoringNote: string;
  terminationTriggered: boolean;
  terminationReason: string | null;
}

const nonNegativeNumber = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
};

const metadataNumber = (
  detail: ViolationCategoryDetail,
  key: string,
): number | null => nonNegativeNumber(detail.metadata?.[key]);

const metadataString = (
  detail: ViolationCategoryDetail,
  key: string,
): string | null => {
  const value = detail.metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const metadataBoolean = (
  detail: ViolationCategoryDetail,
  key: string,
): boolean | null => {
  const value = detail.metadata?.[key];
  return typeof value === 'boolean' ? value : null;
};

export const formatViolationDuration = (
  durationMs: number | null | undefined,
): string => {
  const value = nonNegativeNumber(durationMs);
  if (value === null) return 'Not available';
  if (value < 1_000) return `${value.toLocaleString()} ms`;

  const seconds = value / 1_000;
  const exactSeconds = Number.isInteger(seconds)
    ? String(seconds)
    : seconds.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return `${exactSeconds} second${seconds === 1 ? '' : 's'} (${value.toLocaleString()} ms)`;
};

const categoryLabel = (violationType: string) => {
  if (violationType === 'tab_switch') return 'Tab switching';
  if (violationType === 'face_absent') return 'Face not visible';
  if (violationType === 'multiple_faces') return 'Multiple faces detected';
  return formatLabel(violationType);
};

const faceDuration = (
  directValue: number | null | undefined,
  detail: ViolationCategoryDetail,
  metadataKey: string,
) => nonNegativeNumber(directValue) ?? metadataNumber(detail, metadataKey);

export const buildViolationCategoryPresentation = (
  detail: ViolationCategoryDetail,
): ViolationCategoryPresentation => {
  const facts: ViolationCategoryFact[] = [];
  const scoredCount = Math.max(0, Number(detail.scored_occurrence_count) || 0);
  const occurrenceCount = Math.max(0, Number(detail.occurrence_count) || 0);
  const isTabSwitch = detail.violation_type === 'tab_switch';
  const isFaceCategory =
    detail.violation_type === 'face_absent' ||
    detail.violation_type === 'multiple_faces';

  if (isTabSwitch) {
    const exactTabCount =
      nonNegativeNumber(detail.tab_switch_count) ??
      metadataNumber(detail, 'tab_switch_count') ??
      occurrenceCount;
    facts.push({ label: 'Exact tab-switch count', value: String(exactTabCount) });
  } else {
    facts.push({ label: 'Observed occurrences', value: String(occurrenceCount) });
  }

  facts.push({ label: 'Scored occurrences', value: String(scoredCount) });

  if (isFaceCategory) {
    const observedDuration = faceDuration(
      detail.observed_duration_ms,
      detail,
      'observed_duration_ms',
    );
    const maxDuration = faceDuration(
      detail.max_observed_duration_ms,
      detail,
      'max_observed_duration_ms',
    );
    const totalDuration = faceDuration(
      detail.total_observed_duration_ms,
      detail,
      'total_observed_duration_ms',
    );
    const maxFaceCount =
      nonNegativeNumber(detail.max_face_count) ??
      metadataNumber(detail, 'max_face_count');
    const observedDurations = Array.isArray(detail.observed_durations_ms)
      ? detail.observed_durations_ms
          .map(nonNegativeNumber)
          .filter((value): value is number => value !== null)
      : [];

    facts.push(
      { label: 'Observed duration', value: formatViolationDuration(observedDuration) },
      { label: 'Longest continuous duration', value: formatViolationDuration(maxDuration) },
      { label: 'Total observed duration', value: formatViolationDuration(totalDuration) },
      {
        label: 'Maximum faces detected',
        value: maxFaceCount === null ? 'Not available' : String(maxFaceCount),
      },
    );
    if (observedDurations.length > 0) {
      facts.push({
        label: 'Recorded episode durations',
        value: observedDurations.map(formatViolationDuration).join(', '),
      });
    }
  }

  const source = metadataString(detail, 'source');
  if (source) {
    facts.push({ label: 'Detection source', value: formatLabel(source) });
  }

  const terminationReason =
    (typeof detail.termination_reason === 'string' &&
    detail.termination_reason.trim()
      ? detail.termination_reason.trim()
      : null) ?? metadataString(detail, 'termination_reason');
  const explicitTermination =
    (typeof detail.termination_triggered === 'boolean'
      ? detail.termination_triggered
      : null) ?? metadataBoolean(detail, 'termination_triggered');
  const tabThreshold = metadataNumber(detail, 'termination_threshold_count');
  const durationThreshold =
    nonNegativeNumber(detail.termination_duration_ms) ??
    metadataNumber(detail, 'termination_duration_ms');
  const tabCount =
    nonNegativeNumber(detail.tab_switch_count) ??
    metadataNumber(detail, 'tab_switch_count');
  const maxDuration = faceDuration(
    detail.max_observed_duration_ms,
    detail,
    'max_observed_duration_ms',
  );
  const terminationTriggered =
    explicitTermination ??
    Boolean(
      terminationReason ||
        (tabThreshold !== null && tabCount !== null && tabCount >= tabThreshold) ||
        (durationThreshold !== null &&
          maxDuration !== null &&
          maxDuration >= durationThreshold),
    );

  if (tabThreshold !== null) {
    facts.push({
      label: 'Termination threshold',
      value: `${tabThreshold} tab switch${tabThreshold === 1 ? '' : 'es'}`,
    });
  } else if (durationThreshold !== null) {
    facts.push({
      label: 'Termination threshold',
      value: formatViolationDuration(durationThreshold),
    });
  }
  facts.push({
    label: 'Interview termination',
    value: terminationTriggered ? 'Triggered' : 'Not triggered',
  });

  return {
    label: categoryLabel(detail.violation_type),
    severityLabel: `${formatLabel(detail.severity)} severity`,
    occurredAt: formatDateTime(detail.timestamp),
    facts,
    scoringNote: `${occurrenceCount} recorded occurrence${occurrenceCount === 1 ? '' : 's'}; ${scoredCount} counted toward the violation score.`,
    terminationTriggered,
    terminationReason: terminationReason
      ? formatLabel(terminationReason)
      : null,
  };
};
