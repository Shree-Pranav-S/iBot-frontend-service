import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
  FaceProctoringTracker,
  type FaceProctoringCondition,
  type FaceProctoringTrigger,
} from '../utils/faceProctoringState';
import { createFaceDetectorWorker } from '../../../workers/createFaceDetectorWorker';

const SAMPLE_INTERVAL_MS = 500;
const FRAME_WIDTH = 320;
const FRAME_HEIGHT = 180;
const MAX_CONSECUTIVE_WORKER_ERRORS = 3;

export const FACE_DETECTOR_VERSION = 'mediapipe-tasks-vision@0.10.35';
export const FACE_DETECTOR_MODEL = 'blaze_face_short_range_float16';

export type FaceDetectorStatus =
  | 'disabled'
  | 'starting'
  | 'ready'
  | 'unavailable';

export interface FaceProctoringViolationEvent {
  type: FaceProctoringCondition;
  event_id: string;
  condition_started_at: string;
  observed_duration_ms: number;
  sample_count: number;
  max_face_count: number;
  min_confidence: number | null;
  max_confidence: number | null;
  source: 'mediapipe_face_detector' | 'camera_state';
  detector_version: string;
  model_name: string;
}

interface WorkerResultMessage {
  type: 'result';
  timestampMs: number;
  faceCount: number;
  confidenceScores: number[];
  inferenceTimeMs: number;
}

interface WorkerReadyMessage {
  type: 'ready';
}

interface WorkerSkippedMessage {
  type: 'skipped';
}

interface WorkerErrorMessage {
  type: 'error';
  message: string;
  fatal: boolean;
}

type WorkerMessage =
  | WorkerResultMessage
  | WorkerReadyMessage
  | WorkerSkippedMessage
  | WorkerErrorMessage;

interface UseFaceProctoringOptions {
  enabled: boolean;
  cameraAvailable: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onViolation: (event: FaceProctoringViolationEvent) => void;
}

const assetUrl = (relativePath: string) => {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  return new URL(relativePath, base).toString();
};

const eventFromTrigger = (
  trigger: FaceProctoringTrigger,
): FaceProctoringViolationEvent => ({
  type: trigger.condition,
  event_id: window.crypto.randomUUID(),
  // `startedAtMs` is from performance.now(). Converting it with the stable
  // time origin gives the short-warning and terminal updates an identical
  // episode key, allowing the backend to merge them instead of double-counting.
  condition_started_at: new Date(
    performance.timeOrigin + trigger.startedAtMs,
  ).toISOString(),
  observed_duration_ms: Math.round(trigger.observedDurationMs),
  sample_count: trigger.sampleCount,
  max_face_count: trigger.maxFaceCount,
  min_confidence: trigger.minConfidence,
  max_confidence: trigger.maxConfidence,
  source: trigger.source,
  detector_version: FACE_DETECTOR_VERSION,
  model_name: FACE_DETECTOR_MODEL,
});

export function useFaceProctoring({
  enabled,
  cameraAvailable,
  videoRef,
  onViolation,
}: UseFaceProctoringOptions) {
  const [status, setStatus] = useState<FaceDetectorStatus>(
    enabled ? 'starting' : 'disabled',
  );
  const [alertCondition, setAlertCondition] =
    useState<FaceProctoringCondition | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastInferenceTimeMs, setLastInferenceTimeMs] = useState<number | null>(
    null,
  );

  const workerRef = useRef<Worker | null>(null);
  const trackerRef = useRef(new FaceProctoringTracker());
  const busyRef = useRef(false);
  const workerErrorCountRef = useRef(0);
  const onViolationRef = useRef(onViolation);

  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  const resetTracker = useCallback(() => {
    trackerRef.current.reset();
    setAlertCondition(null);
  }, []);

  const processObservation = useCallback(
    ({
      timestampMs,
      faceCount,
      confidenceScores,
      source,
    }: {
      timestampMs: number;
      faceCount: number;
      confidenceScores: number[];
      source: 'mediapipe_face_detector' | 'camera_state';
    }) => {
      const update = trackerRef.current.observe({
        timestampMs,
        faceCount,
        confidenceScores,
        source,
      });
      setAlertCondition((current) =>
        current === update.alertCondition ? current : update.alertCondition,
      );
      if (update.trigger) {
        onViolationRef.current(eventFromTrigger(update.trigger));
      }
      // The terminal threshold uses the same durable proctoring packet shape.
      // The backend aggregates the violation category while still using this
      // longer observation to terminate an unsafe session authoritatively.
      if (update.terminationTrigger) {
        onViolationRef.current(eventFromTrigger(update.terminationTrigger));
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled) {
      const resetTimer = window.setTimeout(() => {
        setStatus('disabled');
        setErrorMessage(null);
        resetTracker();
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const startingTimer = window.setTimeout(() => {
      setStatus('starting');
      setErrorMessage(null);
    }, 0);
    workerErrorCountRef.current = 0;
    const worker = createFaceDetectorWorker();
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      if (message.type === 'ready') {
        setStatus('ready');
        setErrorMessage(null);
        return;
      }
      if (message.type === 'skipped') {
        busyRef.current = false;
        return;
      }
      if (message.type === 'result') {
        busyRef.current = false;
        workerErrorCountRef.current = 0;
        setLastInferenceTimeMs(message.inferenceTimeMs);
        processObservation({
          timestampMs: message.timestampMs,
          faceCount: message.faceCount,
          confidenceScores: message.confidenceScores,
          source: 'mediapipe_face_detector',
        });
        return;
      }

      busyRef.current = false;
      workerErrorCountRef.current += 1;
      setErrorMessage(message.message);
      console.error('Face monitoring worker reported an error.', {
        fatal: message.fatal,
        message: message.message,
      });
      if (
        message.fatal ||
        workerErrorCountRef.current >= MAX_CONSECUTIVE_WORKER_ERRORS
      ) {
        setStatus('unavailable');
        resetTracker();
      }
    };

    worker.onerror = (event) => {
      busyRef.current = false;
      setStatus('unavailable');
      setErrorMessage(event.message || 'Face monitoring worker failed.');
      console.error('Face monitoring worker failed.', event.message);
      resetTracker();
    };

    worker.postMessage({
      type: 'initialize',
      wasmRoot: assetUrl('mediapipe/wasm'),
      modelUrl: assetUrl(
        'mediapipe/models/blaze_face_short_range.tflite',
      ),
    });

    return () => {
      worker.postMessage({ type: 'dispose' });
      worker.terminate();
      workerRef.current = null;
      busyRef.current = false;
      window.clearTimeout(startingTimer);
      resetTracker();
    };
  }, [enabled, processObservation, resetTracker]);

  useEffect(() => {
    if (!enabled || (status !== 'ready' && cameraAvailable)) return;

    let cancelled = false;
    const sample = async () => {
      if (cancelled || document.visibilityState !== 'visible') {
        return;
      }

      const timestampMs = performance.now();
      if (!cameraAvailable) {
        processObservation({
          timestampMs,
          faceCount: 0,
          confidenceScores: [],
          source: 'camera_state',
        });
        return;
      }

      const worker = workerRef.current;
      const video = videoRef.current;
      if (
        !worker ||
        !video ||
        busyRef.current ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        video.videoWidth <= 0 ||
        video.videoHeight <= 0
      ) {
        return;
      }

      busyRef.current = true;
      let bitmap: ImageBitmap | null = null;
      try {
        bitmap = await createImageBitmap(video, 0, 0, video.videoWidth, video.videoHeight, {
          resizeWidth: FRAME_WIDTH,
          resizeHeight: FRAME_HEIGHT,
          resizeQuality: 'low',
        });
        if (cancelled || !workerRef.current) {
          bitmap.close();
          busyRef.current = false;
          return;
        }
        worker.postMessage(
          { type: 'detect', bitmap, timestampMs },
          [bitmap],
        );
      } catch (error) {
        bitmap?.close();
        busyRef.current = false;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to capture a camera frame.',
        );
      }
    };

    void sample();
    const intervalId = window.setInterval(() => {
      void sample();
    }, SAMPLE_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        resetTracker();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    cameraAvailable,
    enabled,
    processObservation,
    resetTracker,
    status,
    videoRef,
  ]);

  return {
    status,
    alertCondition,
    errorMessage,
    lastInferenceTimeMs,
  };
}
