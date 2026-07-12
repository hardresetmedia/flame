// Client-side unit tests (pure utilities: rules engine, CIDR matcher,
// profile filter, hash parser). Component/integration coverage lives in the
// root Playwright e2e suite, not here.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
