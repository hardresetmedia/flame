// Locks the behavior of /api/auth (login + token validation).
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { bootApp } from './helpers.js';

let api;

beforeAll(async () => {
  api = await bootApp();
});

describe('POST /api/auth', () => {
  it('returns a signed token for the correct password', async () => {
    const res = await request(api)
      .post('/api/auth')
      .send({ password: process.env.PASSWORD, duration: '1h' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.token).toBe('string');
    // JWT shape: three dot-separated base64url segments
    expect(res.body.data.token.split('.')).toHaveLength(3);
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(api)
      .post('/api/auth')
      .send({ password: 'definitely-wrong', duration: '1h' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects a request missing the password field with 400', async () => {
    const res = await request(api).post('/api/auth').send({ duration: '1h' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/);
  });
});

describe('POST /api/auth/validate', () => {
  it('validates a freshly issued token', async () => {
    const login = await request(api)
      .post('/api/auth')
      .send({ password: process.env.PASSWORD, duration: '1h' });

    const res = await request(api)
      .post('/api/auth/validate')
      .send({ token: login.body.data.token });

    expect(res.status).toBe(200);
    expect(res.body.data.token.isValid).toBe(true);
  });

  it('rejects a garbage token with 401', async () => {
    const res = await request(api)
      .post('/api/auth/validate')
      .send({ token: 'not.a.jwt' });

    expect(res.status).toBe(401);
  });
});
