// Shared helpers for the server API test-suite. Each test file runs in its
// own forked process whose cwd is an isolated scratch dir (tests/setup.js),
// so bootApp() yields a fresh SQLite DB and config.json per file. Server
// modules are loaded through Node's native CJS require (createRequire) so
// they run exactly as in production, untouched by vite transforms.
import { createRequire } from 'node:module';
import http from 'node:http';
import request from 'supertest';

const require = createRequire(import.meta.url);

// Returns a base URL string (not the Express app): supertest would otherwise
// bind its throwaway server to 0.0.0.0 per request, which sandboxed dev
// environments may refuse — an explicit 127.0.0.1 listener works everywhere.
export const bootApp = async () => {
  const initConfig = require('../utils/init/initConfig');
  await initConfig();

  const { connectDB } = require('../db');
  await connectDB();

  require('../models/associateModels')();

  const server = http.createServer(require('../api'));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  return `http://127.0.0.1:${server.address().port}`;
};

export const loginAndGetToken = async (api) => {
  const res = await request(api)
    .post('/api/auth')
    .send({ password: process.env.PASSWORD, duration: '1h' });

  if (!res.body?.data?.token) {
    throw new Error(`Test login failed: ${JSON.stringify(res.body)}`);
  }

  return res.body.data.token;
};

export const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

// Several endpoints (reorder, category delete) fire their DB writes without
// awaiting them before responding; give those writes a moment to land.
export const settle = (ms = 150) => new Promise((r) => setTimeout(r, ms));
