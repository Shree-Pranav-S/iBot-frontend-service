import { describe, expect, it } from 'vitest';
import type { AssessmentSummaryResponse } from '../../../types/assessment.types';
import {
  buildAssessmentInstanceNumbers,
  buildAssessmentSelectOption,
  formatAssessmentCreatedDate,
  formatAssessmentReference,
  formatAssessmentTitle,
  nextAssessmentRunNumber,
} from './assessmentDisplay';

const assessment = (
  id: string,
  overrides: Partial<AssessmentSummaryResponse> = {},
): AssessmentSummaryResponse => ({
  id,
  title: 'Python Hiring',
  role_name: 'Backend Developer',
  status: 'ACTIVE',
  interview_duration_mins: 30,
  window_start: '2026-07-20T12:00:00Z',
  window_end: '2026-07-27T12:00:00Z',
  created_at: '2026-07-16T12:00:00Z',
  ...overrides,
});

describe('assessment campaign display identity', () => {
  it('assigns deterministic runs using creation time and UUID as a tie-breaker', () => {
    const first = assessment('cccccccc-0000-0000-0000-000000000000', {
      title: ' python   hiring ',
      role_name: 'BACKEND DEVELOPER',
      created_at: '2026-07-15T12:00:00Z',
    });
    const second = assessment('aaaaaaaa-0000-0000-0000-000000000000');
    const third = assessment('bbbbbbbb-0000-0000-0000-000000000000');
    const unique = assessment('dddddddd-0000-0000-0000-000000000000', {
      title: 'Platform Hiring',
    });

    const runs = buildAssessmentInstanceNumbers([
      third,
      unique,
      first,
      second,
    ]);

    expect(runs.get(first.id)).toBe(1);
    expect(runs.get(second.id)).toBe(2);
    expect(runs.get(third.id)).toBe(3);
    expect(runs.has(unique.id)).toBe(false);
  });

  it('creates a stable short reference from the immutable UUID', () => {
    expect(
      formatAssessmentReference('3f82a1c7-ef11-4fca-8828-a2c6eb1f21b9'),
    ).toBe('ASM-3F82A1C7');
  });

  it('uses Run N for duplicates and keeps creation date as labeled metadata', () => {
    const item = assessment('3f82a1c7-ef11-4fca-8828-a2c6eb1f21b9');
    const runs = new Map([[item.id, 2]]);

    expect(formatAssessmentTitle(item, runs)).toBe('Python Hiring · Run 2');
    expect(formatAssessmentCreatedDate(item.created_at)).toBe(
      'Created Jul 16, 2026',
    );
    expect(buildAssessmentSelectOption(item, runs)).toEqual({
      value: item.id,
      label: 'Python Hiring · Run 2',
      description:
        'Backend Developer · ASM-3F82A1C7 · Created Jul 16, 2026 · ACTIVE',
    });
  });

  it('calculates the next duplicate run without blocking unique campaigns', () => {
    const items = [
      assessment('aaaaaaaa-0000-0000-0000-000000000000'),
      assessment('bbbbbbbb-0000-0000-0000-000000000000'),
    ];

    expect(
      nextAssessmentRunNumber(
        items,
        '  PYTHON HIRING ',
        ' backend developer ',
      ),
    ).toBe(3);
    expect(
      nextAssessmentRunNumber(items, 'Python Hiring', 'Data Engineer'),
    ).toBeNull();
    expect(nextAssessmentRunNumber(items, '', 'Backend Developer')).toBeNull();
  });
});
