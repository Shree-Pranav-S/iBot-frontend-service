import type { AssessmentSummaryResponse } from '../../../types/assessment.types';

function normalizedGroupKey(title: string, roleName: string): string {
  const normalize = (value: string) =>
    value.trim().replace(/\s+/g, ' ').toLowerCase();
  return `${normalize(title)}::${normalize(roleName)}`;
}

function groupKey(assessment: AssessmentSummaryResponse): string {
  return normalizedGroupKey(assessment.title, assessment.role_name);
}

function createdAtTime(assessment: AssessmentSummaryResponse): number {
  const value = new Date(assessment.created_at).getTime();
  return Number.isFinite(value) ? value : 0;
}

/** Assigns 1-based run numbers for campaigns sharing the same title and role. */
export function buildAssessmentInstanceNumbers(
  assessments: AssessmentSummaryResponse[],
): Map<string, number> {
  const groups = new Map<string, AssessmentSummaryResponse[]>();

  for (const assessment of assessments) {
    const key = groupKey(assessment);
    const group = groups.get(key) ?? [];
    group.push(assessment);
    groups.set(key, group);
  }

  const result = new Map<string, number>();

  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort(
      (left, right) =>
        createdAtTime(left) - createdAtTime(right) ||
        left.id.localeCompare(right.id),
    );
    sorted.forEach((assessment, index) => {
      result.set(assessment.id, index + 1);
    });
  }

  return result;
}

/** Human-friendly reference derived from the immutable assessment UUID. */
export function formatAssessmentReference(id: string): string {
  const normalized = id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  return `ASM-${normalized || 'UNKNOWN'}`;
}

/** Labeled creation date shown as secondary metadata rather than identity. */
export function formatAssessmentCreatedDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (!Number.isFinite(date.getTime())) return 'Created date unavailable';
  return `Created ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

/** Return a next run number only when the entered title and role already exist. */
export function nextAssessmentRunNumber(
  assessments: AssessmentSummaryResponse[],
  title: string,
  roleName: string,
): number | null {
  if (!title.trim() || !roleName.trim()) return null;
  const key = normalizedGroupKey(title, roleName);
  const matchCount = assessments.filter(
    (assessment) => groupKey(assessment) === key,
  ).length;
  return matchCount > 0 ? matchCount + 1 : null;
}

/** Add a clear Run N suffix only when title and role are duplicated. */
export function formatAssessmentTitle(
  assessment: AssessmentSummaryResponse,
  instanceNumbers: Map<string, number>,
): string {
  const runNumber = instanceNumbers.get(assessment.id);
  return runNumber
    ? `${assessment.title} · Run ${runNumber}`
    : assessment.title;
}

export interface AssessmentSelectOption {
  value: string;
  label: string;
  description: string;
}

export function buildAssessmentSelectOption(
  assessment: AssessmentSummaryResponse,
  instanceNumbers: Map<string, number>,
  options?: { enrolledAssessmentIds?: Set<string> },
): AssessmentSelectOption {
  const isEnrolled = options?.enrolledAssessmentIds?.has(assessment.id);
  return {
    value: assessment.id,
    label: formatAssessmentTitle(assessment, instanceNumbers),
    description: isEnrolled
      ? `${assessment.role_name} · ${formatAssessmentReference(assessment.id)} · Already enrolled`
      : `${assessment.role_name} · ${formatAssessmentReference(assessment.id)} · ${formatAssessmentCreatedDate(assessment.created_at)} · ${assessment.status}`,
  };
}

export function buildAssessmentSelectOptions(
  assessments: AssessmentSummaryResponse[],
  instanceNumbers: Map<string, number>,
  options?: { enrolledAssessmentIds?: Set<string> },
): AssessmentSelectOption[] {
  return assessments.map((assessment) =>
    buildAssessmentSelectOption(assessment, instanceNumbers, options),
  );
}

export function formatEnrolledAssessmentsList(
  assessmentIds: string[],
  assessments: AssessmentSummaryResponse[],
  instanceNumbers: Map<string, number>,
): string {
  const byId = new Map(assessments.map((assessment) => [assessment.id, assessment]));
  return assessmentIds
    .map((id) => {
      const assessment = byId.get(id);
      return assessment ? formatAssessmentTitle(assessment, instanceNumbers) : null;
    })
    .filter((label): label is string => label !== null)
    .join(', ');
}
