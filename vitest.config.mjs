// vitest config for the server API integration tests (tests/*.test.js).
// pool 'forks' + per-file isolation means every test file gets its own
// process, own scratch cwd (tests/setup.js) and therefore its own SQLite DB.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    setupFiles: ['./tests/setup.js'],
    pool: 'forks',
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 20000,
  },
});
