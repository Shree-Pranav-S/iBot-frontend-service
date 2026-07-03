import type { CandidateAssessmentListItem } from '../../../types/candidate.types';

const STATUS_PRIORITY: Record<CandidateAssessmentListItem['status'], number> = {
  IN_PROGRESS: 6,
  WAITING_ROOM: 5,
  INVITED: 4,
  COMPLETED: 3,
  EVALUATED: 2,
  TERMINATED: 1,
};

function pickPrimaryEnrollment(
  enrollments: CandidateAssessmentListItem[],
): CandidateAssessmentListItem {
  return enrollments.reduce((best, current) =>
    STATUS_PRIORITY[current.status] > STATUS_PRIORITY[best.status] ? current : best,
  );
}

/**
 * Collapse per-assessment rows into one row per candidate (by email).
 * Used in the "All Campaigns" view so enrolling in another assessment updates
 * the existing row instead of showing a duplicate person.
 */
export function groupCandidatesByIdentity(
  candidates: CandidateAssessmentListItem[],
): CandidateAssessmentListItem[] {
  const groups = new Map<string, CandidateAssessmentListItem[]>();
  const order: string[] = [];

  for (const candidate of candidates) {
    const key = candidate.email.trim().toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(candidate);
  }

  return order.map((key) => {
    const group = groups.get(key)!;
    if (group.length === 1) {
      return { ...group[0], enrollments: group };
    }

    const primary = pickPrimaryEnrollment(group);

    return {
      ...primary,
      enrollments: group,
      resume_parse_status: group.some(
        (enrollment) => enrollment.resume_parse_status === 'PENDING',
      )
        ? 'PENDING'
        : primary.resume_parse_status,
    };
  });
}
