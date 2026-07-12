// Locks the behavior of /api/config: defaults, auth-gated writes, merge
// semantics. NOTE: the assertions about WEATHER_API_KEY exposure encode the
// *current* (leaky) behavior on purpose — the hardening phase changes them.
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { bootApp, loginAndGetToken, authHeaders } from './helpers.js';

let api;
let token;

beforeAll(async () => {
  api = await bootApp();
  token = await loginAndGetToken(api);
});

describe('/api/config', () => {
  it('GET returns the default config', async () => {
    const res = await request(api).get('/api/config');

    expect(res.status).toBe(200);
    expect(res.body.data.customTitle).toBe('Flame');
    expect(res.body.data.defaultSearchProvider).toBe('l');
    // Current behavior: the whole config file, secrets included, is public.
    expect(Object.keys(res.body.data)).toContain('WEATHER_API_KEY');
  });

  it('PUT without a token is rejected with 401', async () => {
    const res = await request(api)
      .put('/api/config')
      .send({ customTitle: 'Hacked' });

    expect(res.status).toBe(401);
  });

  it('PUT merges the payload into the existing config', async () => {
    const res = await request(api)
      .put('/api/config')
      .set(authHeaders(token))
      .send({ customTitle: 'My Dashboard', showTime: true });

    expect(res.status).toBe(200);
    expect(res.body.data.customTitle).toBe('My Dashboard');
    expect(res.body.data.showTime).toBe(true);
    // untouched keys survive the merge
    expect(res.body.data.defaultSearchProvider).toBe('l');

    const after = await request(api).get('/api/config');
    expect(after.body.data.customTitle).toBe('My Dashboard');
  });
});
