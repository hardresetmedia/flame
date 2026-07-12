// Locks the hardening behaviors added on top of upstream: JWT lifetime
// clamping, default-password refusal, login rate limiting and security
// headers. NOTE: the login rate limiter counts every POST /api/auth in this
// process (10 per window) — the test order below is budgeted around that,
// so keep it stable when adding tests.
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { bootApp } from './helpers.js';

let api;

const decodeJwtPayload = (token) =>
  JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());

beforeAll(async () => {
  api = await bootApp();
});

describe('hardening', () => {
  // login POST #1
  it('clamps client-requested JWT lifetimes to the allow-list', async () => {
    const res = await request(api)
      .post('/api/auth')
      .send({ password: process.env.PASSWORD, duration: '1y' });

    expect(res.status).toBe(200);

    const { iat, exp } = decodeJwtPayload(res.body.data.token);
    // '1y' is not allowed -> falls back to the 1d default
    expect(exp - iat).toBe(24 * 60 * 60);
  });

  // login POST #2
  it('refuses to authenticate while PASSWORD is a known default', async () => {
    const realPassword = process.env.PASSWORD;
    process.env.PASSWORD = 'flame_password';

    try {
      const res = await request(api)
        .post('/api/auth')
        .send({ password: 'flame_password', duration: '1h' });

      expect(res.status).toBe(503);
    } finally {
      process.env.PASSWORD = realPassword;
    }
  });

  it('sends security headers (helmet CSP)', async () => {
    const res = await request(api).get('/api/config');

    expect(res.headers['content-security-policy']).toContain(
      "default-src 'self'"
    );
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  // login POSTs #3-#11: the limiter allows 10 per 15 minutes in total
  it('rate limits login attempts', async () => {
    for (let i = 3; i <= 10; i++) {
      const res = await request(api)
        .post('/api/auth')
        .send({ password: 'wrong-password', duration: '1h' });
      expect(res.status).toBe(401);
    }

    const blocked = await request(api)
      .post('/api/auth')
      .send({ password: 'wrong-password', duration: '1h' });

    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/too many/i);
  });
});
