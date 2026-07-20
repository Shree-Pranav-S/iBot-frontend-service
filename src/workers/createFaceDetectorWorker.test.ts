import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFaceDetectorWorker } from './createFaceDetectorWorker';

describe('createFaceDetectorWorker', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a classic worker without module-worker options', () => {
    let receivedUrl: string | URL | undefined;
    let receivedOptions: WorkerOptions | undefined;

    class WorkerStub {
      constructor(url: string | URL, options?: WorkerOptions) {
        receivedUrl = url;
        receivedOptions = options;
      }
    }

    vi.stubGlobal('Worker', WorkerStub);

    createFaceDetectorWorker();

    expect(String(receivedUrl)).toContain('faceDetector.worker.ts');
    expect(receivedOptions).toBeUndefined();
  });
});
