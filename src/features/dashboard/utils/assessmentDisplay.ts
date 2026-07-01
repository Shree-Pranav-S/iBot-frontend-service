import type { AssessmentSummaryResponse } from '../../../types/assessment.types';

function groupKey(a: AssessmentSummaryResponse): string {
  return `${a.title.trim().toLowerCase()}::${a.role_name.trim().toLowerCase()}`;
}

/** Assigns 1-based instance numbers for campaigns that share the same title + role. */
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
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    sorted.forEach((assessment, index) => {
      result.set(assessment.id, index + 1);
    });
  }

  return result;
}

/** Title with #N suffix when multiple campaigns share the same title and role. */
export function formatAssessmentTitle(
  assessment: AssessmentSummaryResponse,
  instanceNumbers: Map<string, number>,
): string {
  const num = instanceNumbers.get(assessment.id);
  return num ? `${assessment.title} #${num}` : assessment.title;
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
      ? `${assessment.role_name} · Already enrolled`
      : `${assessment.role_name} · ${assessment.status}`,
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
