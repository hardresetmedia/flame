// Locks the behavior of /api/apps: CRUD, isPublic visibility filtering,
// pinAppsByDefault, and reorder.
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { bootApp, loginAndGetToken, authHeaders, settle } from './helpers.js';

let api;
let token;

beforeAll(async () => {
  api = await bootApp();
  token = await loginAndGetToken(api);
});

describe('/api/apps', () => {
  it('GET returns an empty list on a fresh install', async () => {
    const res = await request(api).get('/api/apps');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('POST without a token is rejected with 401', async () => {
    const res = await request(api)
      .post('/api/apps')
      .send({ name: 'GitHub', url: 'github.com' });

    expect(res.status).toBe(401);
  });

  it('POST creates an app with defaults (pinned by default, public, fallback icon)', async () => {
    const res = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .send({ name: 'GitHub', url: 'github.com' });

    expect(res.status).toBe(201);
    const app = res.body.data;
    expect(app.name).toBe('GitHub');
    // initialConfig.json ships pinAppsByDefault: true
    expect(app.isPinned).toBe(true);
    expect(app.isPublic).toBe(1);
    expect(app.icon).toBe('cancel');
    expect(app.description).toBe('');
  });

  it('private apps are hidden from unauthenticated GETs but visible when authenticated', async () => {
    await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .send({ name: 'SecretApp', url: 'secret.local', isPublic: false });

    const anon = await request(api).get('/api/apps');
    const authed = await request(api).get('/api/apps').set(authHeaders(token));

    expect(anon.body.data.map((a) => a.name)).not.toContain('SecretApp');
    expect(authed.body.data.map((a) => a.name)).toContain('SecretApp');
  });

  it('GET /:id of a private app 404s anonymously and 200s authenticated', async () => {
    const created = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .send({ name: 'SecretSingle', url: 'x.local', isPublic: false });
    const id = created.body.data.id;

    const anon = await request(api).get(`/api/apps/${id}`);
    const authed = await request(api)
      .get(`/api/apps/${id}`)
      .set(authHeaders(token));

    expect(anon.status).toBe(404);
    expect(authed.status).toBe(200);
    expect(authed.body.data.name).toBe('SecretSingle');
  });

  it('PUT /:id updates fields', async () => {
    const created = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .send({ name: 'Renameme', url: 'a.local' });
    const id = created.body.data.id;

    const res = await request(api)
      .put(`/api/apps/${id}`)
      .set(authHeaders(token))
      .send({ name: 'Renamed', url: 'b.local' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Renamed');
    expect(res.body.data.url).toBe('b.local');
  });

  it('PUT /0/reorder persists orderId values', async () => {
    const authed = await request(api).get('/api/apps').set(authHeaders(token));
    const order = authed.body.data.map((a, i) => ({
      id: a.id,
      orderId: authed.body.data.length - i,
    }));

    const res = await request(api)
      .put('/api/apps/0/reorder')
      .set(authHeaders(token))
      .send({ apps: order });

    expect(res.status).toBe(200);

    // reorderApps responds before its updates settle (fire-and-forget)
    await settle();

    const after = await request(api).get('/api/apps').set(authHeaders(token));
    const byId = Object.fromEntries(after.body.data.map((a) => [a.id, a.orderId]));
    for (const { id, orderId } of order) {
      expect(byId[id]).toBe(orderId);
    }
  });

  it('DELETE /:id removes the app', async () => {
    const created = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .send({ name: 'Doomed', url: 'doomed.local' });
    const id = created.body.data.id;

    const del = await request(api)
      .delete(`/api/apps/${id}`)
      .set(authHeaders(token));
    expect(del.status).toBe(200);

    const res = await request(api)
      .get(`/api/apps/${id}`)
      .set(authHeaders(token));
    expect(res.status).toBe(404);
  });
});
