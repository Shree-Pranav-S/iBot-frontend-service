export type FaceProctoringCondition = 'face_absent' | 'multiple_faces';

export type FaceObservationSource =
  | 'mediapipe_face_detector'
  | 'camera_state';

export interface FaceObservation {
  timestampMs: number;
  faceCount: number;
  confidenceScores: number[];
  source: FaceObservationSource;
}

export interface FaceProctoringTrigger {
  condition: FaceProctoringCondition;
  startedAtMs: number;
  thresholdMetAtMs: number;
  observedDurationMs: number;
  sampleCount: number;
  maxFaceCount: number;
  minConfidence: number | null;
  maxConfidence: number | null;
  source: FaceObservationSource;
}

export interface FaceTrackerUpdate {
  activeCondition: FaceProctoringCondition | null;
  alertCondition: FaceProctoringCondition | null;
  trigger: FaceProctoringTrigger | null;
  terminationTrigger: FaceProctoringTrigger | null;
}

interface ActiveEpisode {
  condition: FaceProctoringCondition;
  startedAtMs: number;
  mismatchStartedAtMs: number | null;
  mismatchCondition: FaceProctoringCondition | null;
  violationEmitted: boolean;
  terminationEmitted: boolean;
  sampleCount: number;
  maxFaceCount: number;
  minConfidence: number | null;
  maxConfidence: number | null;
  source: FaceObservationSource;
}

export const FACE_ABSENT_THRESHOLD_MS = 5_000;
export const MULTIPLE_FACES_THRESHOLD_MS = 3_000;
export const FACE_ABSENT_TERMINATION_THRESHOLD_MS = 30_000;
export const MULTIPLE_FACES_TERMINATION_THRESHOLD_MS = 20_000;
export const FACE_CONDITION_RECOVERY_MS = 1_000;

const conditionForFaceCount = (
  faceCount: number,
): FaceProctoringCondition | null => {
  if (faceCount <= 0) return 'face_absent';
  if (faceCount > 1) return 'multiple_faces';
  return null;
};

const thresholdForCondition = (condition: FaceProctoringCondition) =>
  condition === 'face_absent'
    ? FACE_ABSENT_THRESHOLD_MS
    : MULTIPLE_FACES_THRESHOLD_MS;

const terminationThresholdForCondition = (
  condition: FaceProctoringCondition,
) =>
  condition === 'face_absent'
    ? FACE_ABSENT_TERMINATION_THRESHOLD_MS
    : MULTIPLE_FACES_TERMINATION_THRESHOLD_MS;

const confidenceRange = (scores: number[]) => {
  const valid = scores.filter(Number.isFinite);
  if (valid.length === 0) {
    return { min: null, max: null };
  }
  return {
    min: Math.min(...valid),
    max: Math.max(...valid),
  };
};

const newEpisode = (
  condition: FaceProctoringCondition,
  observation: FaceObservation,
  startedAtMs = observation.timestampMs,
): ActiveEpisode => {
  const range = confidenceRange(observation.confidenceScores);
  return {
    condition,
    startedAtMs,
    mismatchStartedAtMs: null,
    mismatchCondition: null,
    violationEmitted: false,
    terminationEmitted: false,
    sampleCount: 1,
    maxFaceCount: Math.max(0, observation.faceCount),
    minConfidence: range.min,
    maxConfidence: range.max,
    source: observation.source,
  };
};

const addObservation = (
  episode: ActiveEpisode,
  observation: FaceObservation,
) => {
  const range = confidenceRange(observation.confidenceScores);
  episode.sampleCount += 1;
  episode.maxFaceCount = Math.max(episode.maxFaceCount, observation.faceCount);
  if (range.min !== null) {
    episode.minConfidence =
      episode.minConfidence === null
        ? range.min
        : Math.min(episode.minConfidence, range.min);
  }
  if (range.max !== null) {
    episode.maxConfidence =
      episode.maxConfidence === null
        ? range.max
        : Math.max(episode.maxConfidence, range.max);
  }
  if (observation.source === 'camera_state') {
    episode.source = 'camera_state';
  }
};

export class FaceProctoringTracker {
  private episode: ActiveEpisode | null = null;

  reset(): FaceTrackerUpdate {
    this.episode = null;
    return {
      activeCondition: null,
      alertCondition: null,
      trigger: null,
      terminationTrigger: null,
    };
  }

  observe(observation: FaceObservation): FaceTrackerUpdate {
    const observedCondition = conditionForFaceCount(observation.faceCount);

    if (!this.episode) {
      if (observedCondition) {
        this.episode = newEpisode(observedCondition, observation);
      }
      return this.currentUpdate(null);
    }

    if (observedCondition === this.episode.condition) {
      this.episode.mismatchStartedAtMs = null;
      this.episode.mismatchCondition = null;
      addObservation(this.episode, observation);
      return this.maybeTrigger(observation.timestampMs);
    }

    if (
      this.episode.mismatchStartedAtMs === null ||
      this.episode.mismatchCondition !== observedCondition
    ) {
      this.episode.mismatchStartedAtMs = observation.timestampMs;
      this.episode.mismatchCondition = observedCondition;
      return this.currentUpdate(null);
    }

    if (
      observation.timestampMs - this.episode.mismatchStartedAtMs <
      FACE_CONDITION_RECOVERY_MS
    ) {
      return this.currentUpdate(null);
    }

    const nextStartedAtMs = this.episode.mismatchStartedAtMs;
    if (!observedCondition) {
      return this.reset();
    }

    this.episode = newEpisode(
      observedCondition,
      observation,
      nextStartedAtMs,
    );
    return this.maybeTrigger(observation.timestampMs);
  }

  private maybeTrigger(timestampMs: number): FaceTrackerUpdate {
    if (!this.episode) {
      return this.currentUpdate(null, null);
    }

    const durationMs = Math.max(0, timestampMs - this.episode.startedAtMs);
    const buildTrigger = (): FaceProctoringTrigger => ({
      condition: this.episode!.condition,
      startedAtMs: this.episode!.startedAtMs,
      thresholdMetAtMs: timestampMs,
      observedDurationMs: durationMs,
      sampleCount: this.episode!.sampleCount,
      maxFaceCount: this.episode!.maxFaceCount,
      minConfidence: this.episode!.minConfidence,
      maxConfidence: this.episode!.maxConfidence,
      source: this.episode!.source,
    });

    if (
      !this.episode.terminationEmitted &&
      durationMs >= terminationThresholdForCondition(this.episode.condition)
    ) {
      this.episode.violationEmitted = true;
      this.episode.terminationEmitted = true;
      return this.currentUpdate(null, buildTrigger());
    }

    if (
      !this.episode.violationEmitted &&
      durationMs >= thresholdForCondition(this.episode.condition)
    ) {
      this.episode.violationEmitted = true;
      return this.currentUpdate(buildTrigger(), null);
    }

    return this.currentUpdate(null, null);
  }

  private currentUpdate(
    trigger: FaceProctoringTrigger | null,
    terminationTrigger: FaceProctoringTrigger | null = null,
  ): FaceTrackerUpdate {
    return {
      activeCondition: this.episode?.condition ?? null,
      alertCondition:
        this.episode?.violationEmitted === true ? this.episode.condition : null,
      trigger,
      terminationTrigger,
    };
  }
}
