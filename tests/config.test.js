// Locks the behavior of /api/config after hardening: redacted public
// subset for anonymous requests, full config for authenticated ones,
// allow-listed merge semantics on writes.
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
  it('GET without auth returns only the public subset (no secrets)', async () => {
    const res = await request(api).get('/api/config');

    expect(res.status).toBe(200);
    expect(res.body.data.customTitle).toBe('Flame');
    expect(res.body.data.defaultSearchProvider).toBe('l');

    for (const secretKey of [
      'WEATHER_API_KEY',
      'lat',
      'long',
      'dockerHost',
      'dockerApps',
      'kubernetesApps',
    ]) {
      expect(Object.keys(res.body.data)).not.toContain(secretKey);
    }
  });

  it('GET with auth returns the full config', async () => {
    const res = await request(api).get('/api/config').set(authHeaders(token));

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data)).toContain('WEATHER_API_KEY');
    expect(Object.keys(res.body.data)).toContain('dockerHost');
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

  it('PUT strips keys that are not real config keys', async () => {
    const res = await request(api)
      .put('/api/config')
      .set(authHeaders(token))
      .send({ customTitle: 'Still Fine', injectedKey: 'evil' });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data)).not.toContain('injectedKey');

    const after = await request(api).get('/api/config').set(authHeaders(token));
    expect(Object.keys(after.body.data)).not.toContain('injectedKey');
  });

  it('PUT rejects a dockerHost that is not a bare hostname[:port]', async () => {
    const res = await request(api)
      .put('/api/config')
      .set(authHeaders(token))
      .send({ dockerHost: 'http://evil.example/path' });

    expect(res.status).toBe(400);

    const ok = await request(api)
      .put('/api/config')
      .set(authHeaders(token))
      .send({ dockerHost: 'localhost:2375' });

    expect(ok.status).toBe(200);
  });
});
