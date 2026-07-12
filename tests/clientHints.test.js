// Locks the /api/client-hints endpoint: public, CF-aware IP resolution.
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { bootApp } from './helpers.js';

let api;

beforeAll(async () => {
  api = await bootApp();
});

describe('GET /api/client-hints', () => {
  it('is public and returns an ip', async () => {
    const res = await request(api).get('/api/client-hints');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.ip).toBe('string');
    expect(res.body.data.ip.length).toBeGreaterThan(0);
  });

  it('prefers CF-Connecting-IP over the socket address', async () => {
    const res = await request(api)
      .get('/api/client-hints')
      .set('CF-Connecting-IP', '203.0.113.7');

    expect(res.body.data.ip).toBe('203.0.113.7');
  });

  it('falls back to the first X-Forwarded-For hop', async () => {
    const res = await request(api)
      .get('/api/client-hints')
      .set('X-Forwarded-For', '198.51.100.9, 10.0.0.1');

    expect(res.body.data.ip).toBe('198.51.100.9');
  });
});
