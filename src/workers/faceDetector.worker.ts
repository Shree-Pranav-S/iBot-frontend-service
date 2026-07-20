/// <reference lib="webworker" />

import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

interface InitializeMessage {
  type: 'initialize';
  wasmRoot: string;
  modelUrl: string;
}

interface DetectMessage {
  type: 'detect';
  bitmap: ImageBitmap;
  timestampMs: number;
}

interface DisposeMessage {
  type: 'dispose';
}

type IncomingMessage = InitializeMessage | DetectMessage | DisposeMessage;

const workerScope = self as unknown as DedicatedWorkerGlobalScope;
let detector: FaceDetector | null = null;
let detecting = false;

const postError = (message: string, fatal: boolean) => {
  workerScope.postMessage({ type: 'error', message, fatal });
};

const initialize = async (message: InitializeMessage) => {
  try {
    detector?.close();
    const vision = await FilesetResolver.forVisionTasks(message.wasmRoot);
    detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: message.modelUrl,
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.6,
      minSuppressionThreshold: 0.3,
    });
    workerScope.postMessage({ type: 'ready' });
  } catch (error) {
    detector = null;
    postError(
      error instanceof Error
        ? error.message
        : 'Unable to initialize face detection.',
      true,
    );
  }
};

const detect = (message: DetectMessage) => {
  if (!detector || detecting) {
    message.bitmap.close();
    workerScope.postMessage({ type: 'skipped' });
    return;
  }

  detecting = true;
  const startedAtMs = performance.now();
  try {
    const result = detector.detectForVideo(
      message.bitmap,
      message.timestampMs,
    );
    const confidenceScores = result.detections.map(
      (detection) => detection.categories[0]?.score ?? 0,
    );
    workerScope.postMessage({
      type: 'result',
      timestampMs: message.timestampMs,
      faceCount: result.detections.length,
      confidenceScores,
      inferenceTimeMs: performance.now() - startedAtMs,
    });
  } catch (error) {
    postError(
      error instanceof Error ? error.message : 'Face detection failed.',
      false,
    );
  } finally {
    detecting = false;
    message.bitmap.close();
  }
};

workerScope.onmessage = (event: MessageEvent<IncomingMessage>) => {
  const message = event.data;
  if (message.type === 'initialize') {
    void initialize(message);
    return;
  }
  if (message.type === 'detect') {
    detect(message);
    return;
  }

  detector?.close();
  detector = null;
  workerScope.close();
};
