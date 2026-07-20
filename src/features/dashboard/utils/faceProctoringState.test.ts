import { describe, expect, it } from 'vitest';
import {
  FaceProctoringTracker,
  type FaceObservation,
} from './faceProctoringState';

const observation = (
  timestampMs: number,
  faceCount: number,
  source: FaceObservation['source'] = 'mediapipe_face_detector',
): FaceObservation => ({
  timestampMs,
  faceCount,
  confidenceScores: faceCount > 0 ? [0.91] : [],
  source,
});

describe('FaceProctoringTracker', () => {
  it('emits one absence violation after five seconds', () => {
    const tracker = new FaceProctoringTracker();

    expect(tracker.observe(observation(0, 0)).trigger).toBeNull();
    expect(tracker.observe(observation(4_500, 0)).trigger).toBeNull();
    const update = tracker.observe(observation(5_000, 0));

    expect(update.alertCondition).toBe('face_absent');
    expect(update.trigger?.condition).toBe('face_absent');
    expect(update.trigger?.observedDurationMs).toBe(5_000);
    expect(update.terminationTrigger).toBeNull();
    expect(tracker.observe(observation(8_000, 0)).trigger).toBeNull();
  });

  it('emits one multiple-face violation after three seconds', () => {
    const tracker = new FaceProctoringTracker();

    tracker.observe(observation(1_000, 2));
    const update = tracker.observe(observation(4_000, 2));

    expect(update.alertCondition).toBe('multiple_faces');
    expect(update.trigger?.condition).toBe('multiple_faces');
    expect(update.trigger?.maxFaceCount).toBe(2);
    expect(update.terminationTrigger).toBeNull();
  });

  it('emits one terminal absence observation at thirty continuous seconds', () => {
    const tracker = new FaceProctoringTracker();

    tracker.observe(observation(0, 0));
    expect(tracker.observe(observation(5_000, 0)).trigger?.condition).toBe(
      'face_absent',
    );
    const update = tracker.observe(observation(30_000, 0));

    expect(update.trigger).toBeNull();
    expect(update.terminationTrigger?.condition).toBe('face_absent');
    expect(update.terminationTrigger?.observedDurationMs).toBe(30_000);
    expect(tracker.observe(observation(35_000, 0)).terminationTrigger).toBeNull();
  });

  it('emits one terminal multiple-face observation at twenty continuous seconds', () => {
    const tracker = new FaceProctoringTracker();

    tracker.observe(observation(1_000, 2));
    tracker.observe(observation(4_000, 2));
    const update = tracker.observe(observation(21_000, 3));

    expect(update.terminationTrigger?.condition).toBe('multiple_faces');
    expect(update.terminationTrigger?.observedDurationMs).toBe(20_000);
    expect(update.terminationTrigger?.maxFaceCount).toBe(3);
    expect(tracker.observe(observation(25_000, 2)).terminationTrigger).toBeNull();
  });

  it('emits only the terminal observation when sampling jumps past both thresholds', () => {
    const tracker = new FaceProctoringTracker();

    tracker.observe(observation(0, 0));
    const update = tracker.observe(observation(30_000, 0));

    expect(update.trigger).toBeNull();
    expect(update.terminationTrigger?.condition).toBe('face_absent');
    expect(update.alertCondition).toBe('face_absent');
  });

  it('tolerates a brief missed sample without duplicating the episode', () => {
    const tracker = new FaceProctoringTracker();

    tracker.observe(observation(0, 0));
    tracker.observe(observation(2_000, 1));
    tracker.observe(observation(2_500, 0));
    const update = tracker.observe(observation(5_000, 0));

    expect(update.trigger?.condition).toBe('face_absent');
  });

  it('requires a stable single face before allowing a new episode', () => {
    const tracker = new FaceProctoringTracker();

    tracker.observe(observation(0, 0));
    tracker.observe(observation(5_000, 0));
    tracker.observe(observation(5_500, 1));
    expect(tracker.observe(observation(6_000, 0)).trigger).toBeNull();

    tracker.observe(observation(7_000, 1));
    expect(tracker.observe(observation(8_000, 1)).activeCondition).toBeNull();
    tracker.observe(observation(9_000, 0));
    expect(tracker.observe(observation(14_000, 0)).trigger?.condition).toBe(
      'face_absent',
    );
  });

  it('uses camera health as an absence source', () => {
    const tracker = new FaceProctoringTracker();

    tracker.observe(observation(0, 0, 'camera_state'));
    const update = tracker.observe(observation(5_000, 0, 'camera_state'));

    expect(update.trigger?.source).toBe('camera_state');
  });
});
