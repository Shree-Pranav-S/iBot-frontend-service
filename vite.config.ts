import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // MediaPipe's WASM loader uses importScripts() to expose ModuleFactory.
  // Explicitly keep worker bundles classic/IIFE so that initialization works
  // in both development and production builds.
  worker: {
    format: 'iife',
  },
  server: {
    proxy: {
      '/livekit': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
});
