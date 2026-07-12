// Playwright e2e smoke config. Runs the production server (built client in
// public/ — run `npm run build:client` first) via e2e/start-server.js.
// Locally it drives the installed Google Chrome (channel: 'chrome') so no
// browser download is needed; CI installs and uses bundled chromium.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // The smoke tests build on each other's server state; keep them ordered.
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5005',
    ...(process.env.CI ? {} : { channel: 'chrome' as const }),
  },
  webServer: {
    command: 'node e2e/start-server.js',
    port: 5005,
    reuseExistingServer: false,
    env: {
      NODE_ENV: 'production',
      PORT: '5005',
      PASSWORD: 'e2e-password-123',
      SECRET: 'flame-e2e-secret',
      // Required by db/utils/slugify.js (DB-backup filename); the scratch
      // cwd has no .env for dotenv to load it from.
      VERSION: '2.4.0',
    },
  },
});
