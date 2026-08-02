export interface EditableAssessmentTopic {
  id: string;
  skill: string;
  allocatedMins: number;
  expectedSignals: string[];
}

export interface AssessmentEditValidationInput {
  title: string;
  roleName: string;
  windowStart: string;
  windowEnd: string;
  planLocked: boolean;
  duration: number;
  introMins: number;
  behaviouralMins: number;
  topics: EditableAssessmentTopic[];
}

const hasOneDecimalAtMost = (value: number) =>
  Number.isFinite(value) && Math.abs(value * 10 - Math.round(value * 10)) < 0.000001;

export const allocatedInterviewUnits = (
  introMins: number,
  behaviouralMins: number,
  topics: EditableAssessmentTopic[],
) =>
  Math.round(
    (introMins + behaviouralMins + topics.reduce((sum, topic) => sum + topic.allocatedMins, 0)) *
      10,
  );

export const validateAssessmentEdit = ({
  title,
  roleName,
  windowStart,
  windowEnd,
  planLocked,
  duration,
  introMins,
  behaviouralMins,
  topics,
}: AssessmentEditValidationInput): string | null => {
  if (title.trim().length < 2) return 'Assessment title must contain at least 2 characters.';
  if (roleName.trim().length < 2) return 'Role name must contain at least 2 characters.';
  const start = new Date(windowStart);
  const end = new Date(windowEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Choose a valid start and end date.';
  }
  if (end <= start) return 'The end of the interview window must be after its start.';
  if (planLocked) return null;
  if (!Number.isInteger(duration) || duration < 2 || duration > 180) {
    return 'Duration must be a whole number between 2 and 180 minutes.';
  }
  if (topics.length === 0) return 'Add at least one technical or domain topic.';
  const topicKeys = topics.map((topic) => topic.skill.trim().toLocaleLowerCase());
  if (topicKeys.some((topic) => !topic)) return 'Every topic needs a name.';
  if (new Set(topicKeys).size !== topicKeys.length) return 'Topic names must be unique.';
  if (topicKeys.some((topic) => ['self_intro', 'behavioural_cultural'].includes(topic))) {
    return 'A technical topic is using a reserved section name.';
  }
  const times = [introMins, ...topics.map((topic) => topic.allocatedMins), behaviouralMins];
  if (times.some((value) => value < 0.1 || !hasOneDecimalAtMost(value))) {
    return 'Each section needs at least 0.1 minutes and may use one decimal place.';
  }
  for (const topic of topics) {
    const signals = topic.expectedSignals.map((signal) => signal.trim());
    if (signals.length < 2 || signals.length > 4 || signals.some((signal) => !signal)) {
      return `“${topic.skill || 'Untitled topic'}” needs 2–4 complete expected signals.`;
    }
    if (new Set(signals.map((signal) => signal.toLocaleLowerCase())).size !== signals.length) {
      return `Expected signals for “${topic.skill}” must be unique.`;
    }
  }
  if (allocatedInterviewUnits(introMins, behaviouralMins, topics) !== duration * 10) {
    return `Section time must equal ${duration} minutes.`;
  }
  return null;
};
