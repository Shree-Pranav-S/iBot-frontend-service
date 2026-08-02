import { describe, expect, it } from 'vitest';
import {
  allocatedInterviewUnits,
  validateAssessmentEdit,
  type AssessmentEditValidationInput,
} from './assessmentEdit';

const validInput = (): AssessmentEditValidationInput => ({
  title: 'Backend assessment',
  roleName: 'Backend Engineer',
  windowStart: '2026-08-02T10:00',
  windowEnd: '2026-08-03T10:00',
  planLocked: false,
  duration: 10,
  introMins: 1,
  behaviouralMins: 1,
  topics: [
    {
      id: 'python',
      skill: 'Python',
      allocatedMins: 8,
      expectedSignals: ['Explains language mechanisms', 'Applies production trade-offs'],
    },
  ],
});

describe('assessment edit validation', () => {
  it('accepts an exact, schema-valid interview plan', () => {
    expect(validateAssessmentEdit(validInput())).toBeNull();
    expect(allocatedInterviewUnits(1, 1, validInput().topics)).toBe(100);
  });

  it('rejects duplicate topics and mismatched section totals', () => {
    const duplicate = validInput();
    duplicate.topics.push({ ...duplicate.topics[0], id: 'duplicate', allocatedMins: 1 });
    expect(validateAssessmentEdit(duplicate)).toBe('Topic names must be unique.');

    const incorrectTotal = validInput();
    incorrectTotal.topics[0].allocatedMins = 7.5;
    expect(validateAssessmentEdit(incorrectTotal)).toBe('Section time must equal 10 minutes.');
  });

  it('requires two to four complete, unique expected signals', () => {
    const missing = validInput();
    missing.topics[0].expectedSignals = ['Only one'];
    expect(validateAssessmentEdit(missing)).toContain('needs 2–4 complete expected signals');

    const duplicate = validInput();
    duplicate.topics[0].expectedSignals = ['Ownership', 'ownership'];
    expect(validateAssessmentEdit(duplicate)).toContain('must be unique');
  });

  it('allows metadata and window validation while a plan is locked', () => {
    const locked = validInput();
    locked.planLocked = true;
    locked.duration = 0;
    locked.topics = [];
    expect(validateAssessmentEdit(locked)).toBeNull();

    locked.windowEnd = locked.windowStart;
    expect(validateAssessmentEdit(locked)).toContain('must be after');
  });
});
