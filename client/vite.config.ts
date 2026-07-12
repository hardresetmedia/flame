// Vite build/dev config for the Flame client (replaces Create React App).
// Dev server proxies API/uploads/websocket traffic to the Express backend
// on :5005 (the role client/src/setupProxy.js played under CRA).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

export default defineConfig({
  plugins: [react()],
  define: {
    // Single-sourced from client/package.json "version" — shown on the
    // settings page (replaces CRA's REACT_APP_VERSION from client/.env).
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5005',
      '/uploads': 'http://localhost:5005',
      '/socket': {
        target: 'ws://localhost:5005',
        ws: true,
      },
    },
  },
  build: {
    // Keep CRA's output dir so the Dockerfile and root build:client script
    // (client/build -> public/) stay unchanged.
    outDir: 'build',
  },
});
