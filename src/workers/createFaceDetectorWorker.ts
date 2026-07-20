export const createFaceDetectorWorker = () =>
  // MediaPipe exposes its Emscripten ModuleFactory with importScripts().
  // Passing { type: 'module' } here makes initialization fail in browsers.
  new Worker(new URL('./faceDetector.worker.ts', import.meta.url));
