// Locks the behavior of icon uploads through POST /api/apps (multer).
// NOTE: these assertions encode the *current* lax behavior on purpose
// (unsupported types are silently dropped, not rejected) — the hardening
// phase tightens this and will update the expectations.
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import request from 'supertest';
import { bootApp, loginAndGetToken, authHeaders } from './helpers.js';

let api;
let token;

// Minimal PNG header + padding; enough for a byte-level smoke check.
const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64),
]);

beforeAll(async () => {
  api = await bootApp();
  token = await loginAndGetToken(api);
});

describe('icon uploads', () => {
  it('accepts a png icon and stores the file under data/uploads', async () => {
    const res = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .field('name', 'WithIcon')
      .field('url', 'icon.local')
      .attach('icon', PNG_BYTES, 'icon.png');

    expect(res.status).toBe(201);
    expect(res.body.data.icon).toMatch(/icon\.png$/);

    // multer writes into cwd-relative data/uploads (the test scratch dir)
    const stored = fs.readdirSync('data/uploads');
    expect(stored).toContain(res.body.data.icon);
  });

  it('silently drops unsupported file types (current behavior)', async () => {
    const res = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .field('name', 'WithBadIcon')
      .field('url', 'bad.local')
      .attach('icon', Buffer.from('MZ-not-an-image'), 'evil.exe');

    // The app is still created; the file is ignored and the icon falls back.
    expect(res.status).toBe(201);
    expect(res.body.data.icon).toBe('cancel');
  });

  it('rejects uploads without a token', async () => {
    const res = await request(api)
      .post('/api/apps')
      .field('name', 'NoAuth')
      .field('url', 'noauth.local')
      .attach('icon', PNG_BYTES, 'icon.png');

    expect(res.status).toBe(401);
  });
});
