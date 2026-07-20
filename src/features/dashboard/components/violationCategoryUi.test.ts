import { describe, expect, it } from 'vitest';
import type { ViolationCategoryDetail } from '../../../types/candidate.types';
import {
  buildViolationCategoryPresentation,
  formatViolationDuration,
} from './violationCategoryUi';

const detail = (
  overrides: Partial<ViolationCategoryDetail>,
): ViolationCategoryDetail => ({
  violation_type: 'tab_switch',
  severity: 'low',
  scored_occurrence_count: 1,
  occurrence_count: 1,
  timestamp: '2026-07-19T10:00:00Z',
  metadata: {},
  ...overrides,
});

describe('violation category presentation', () => {
  it('shows exact tab count while explaining that it was scored once', () => {
    const presentation = buildViolationCategoryPresentation(
      detail({
        occurrence_count: 5,
        tab_switch_count: 5,
        metadata: {
          termination_threshold_count: 5,
          termination_triggered: true,
        },
      }),
    );

    expect(presentation.facts).toContainEqual({
      label: 'Exact tab-switch count',
      value: '5',
    });
    expect(presentation.scoringNote).toBe(
      '5 recorded occurrences; 1 counted toward the violation score.',
    );
    expect(presentation.terminationTriggered).toBe(true);
  });

  it('shows all face durations, face count, and termination reason', () => {
    const presentation = buildViolationCategoryPresentation(
      detail({
        violation_type: 'multiple_faces',
        severity: 'high',
        occurrence_count: 3,
        observed_duration_ms: 20_000,
        max_observed_duration_ms: 20_000,
        total_observed_duration_ms: 27_500,
        observed_durations_ms: [7_500, 20_000],
        termination_duration_ms: 20_000,
        max_face_count: 3,
        termination_triggered: true,
        termination_reason: 'multiple_faces_continuous_duration_exceeded',
        metadata: {
          termination_duration_ms: 99_000,
          termination_triggered: false,
        },
      }),
    );

    expect(presentation.label).toBe('Multiple faces detected');
    expect(presentation.facts).toEqual(
      expect.arrayContaining([
        { label: 'Observed duration', value: '20 seconds (20,000 ms)' },
        {
          label: 'Longest continuous duration',
          value: '20 seconds (20,000 ms)',
        },
        {
          label: 'Total observed duration',
          value: '27.5 seconds (27,500 ms)',
        },
        { label: 'Maximum faces detected', value: '3' },
        {
          label: 'Recorded episode durations',
          value: '7.5 seconds (7,500 ms), 20 seconds (20,000 ms)',
        },
        { label: 'Interview termination', value: 'Triggered' },
      ]),
    );
    expect(presentation.terminationReason).toBe(
      'Multiple Faces Continuous Duration Exceeded',
    );
  });

  it('falls back to metadata fields used by older category records', () => {
    const presentation = buildViolationCategoryPresentation(
      detail({
        violation_type: 'face_absent',
        severity: 'high',
        metadata: {
          max_observed_duration_ms: 5_000,
          total_observed_duration_ms: 8_000,
          max_face_count: 0,
          termination_duration_ms: 30_000,
        },
      }),
    );

    expect(presentation.facts).toContainEqual({
      label: 'Longest continuous duration',
      value: '5 seconds (5,000 ms)',
    });
    expect(presentation.terminationTriggered).toBe(false);
  });

  it('formats millisecond durations without losing precision', () => {
    expect(formatViolationDuration(3_250)).toBe('3.25 seconds (3,250 ms)');
    expect(formatViolationDuration(250)).toBe('250 ms');
    expect(formatViolationDuration(null)).toBe('Not available');
  });
});
