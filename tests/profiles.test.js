// Locks the /api/profiles feature: CRUD + validation, single-default
// enforcement, overrides allow-listing, profileIds assignment on apps and
// categories, and the delete-time scrub of assignments.
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { bootApp, loginAndGetToken, authHeaders, settle } from './helpers.js';

let api;
let token;

beforeAll(async () => {
  api = await bootApp();
  token = await loginAndGetToken(api);
});

const createProfile = async (body) => {
  const res = await request(api)
    .post('/api/profiles')
    .set(authHeaders(token))
    .send(body);
  return res;
};

describe('/api/profiles CRUD', () => {
  it('GET is public and returns an empty list on a fresh install', async () => {
    const res = await request(api).get('/api/profiles');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('POST requires auth', async () => {
    const res = await request(api)
      .post('/api/profiles')
      .send({ name: 'nope' });

    expect(res.status).toBe(401);
  });

  it('creates a profile with defaults and lowercases the name', async () => {
    const res = await createProfile({ name: 'NovaStream' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('novastream');
    expect(res.body.data.isDefault).toBe(false);
    expect(res.body.data.rules).toEqual([]);
    expect(res.body.data.orderId).toBe(1);
  });

  it('rejects invalid names (they become URL fragments)', async () => {
    for (const name of ['has space', 'sla/sh', '', 'até']) {
      const res = await createProfile({ name });
      expect(res.status).toBe(400);
    }
  });

  it('rejects duplicate names', async () => {
    const res = await createProfile({ name: 'novastream' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('keeps at most one default profile', async () => {
    const a = await createProfile({ name: 'defaulta', isDefault: true });
    expect(a.body.data.isDefault).toBe(true);

    const b = await createProfile({ name: 'defaultb', isDefault: true });
    expect(b.body.data.isDefault).toBe(true);

    const all = await request(api).get('/api/profiles');
    const defaults = all.body.data.filter((p) => p.isDefault);
    expect(defaults.map((p) => p.name)).toEqual(['defaultb']);
  });

  it('filters overrides down to the overridable config keys', async () => {
    const res = await createProfile({
      name: 'withoverrides',
      overrides: {
        customTitle: 'Work',
        hideApps: true,
        WEATHER_API_KEY: 'nope',
        injected: 'nope',
      },
    });

    expect(res.status).toBe(201);
    expect(res.body.data.overrides).toEqual({
      customTitle: 'Work',
      hideApps: true,
    });
  });

  it('updates a profile and enforces name uniqueness on rename', async () => {
    const created = await createProfile({ name: 'renameme' });
    const id = created.body.data.id;

    const conflict = await request(api)
      .put(`/api/profiles/${id}`)
      .set(authHeaders(token))
      .send({ name: 'novastream' });
    expect(conflict.status).toBe(400);

    const ok = await request(api)
      .put(`/api/profiles/${id}`)
      .set(authHeaders(token))
      .send({ name: 'renamed', theme: 'tron', rules: [] });
    expect(ok.status).toBe(200);
    expect(ok.body.data.name).toBe('renamed');
    expect(ok.body.data.theme).toBe('tron');
  });

  it('reorders profiles', async () => {
    const all = (await request(api).get('/api/profiles')).body.data;
    const reordered = all.map((p, i) => ({
      id: p.id,
      orderId: all.length - i,
    }));

    const res = await request(api)
      .put('/api/profiles/0/reorder')
      .set(authHeaders(token))
      .send({ profiles: reordered });
    expect(res.status).toBe(200);

    const after = (await request(api).get('/api/profiles')).body.data;
    expect(after[0].id).toBe(all[all.length - 1].id);
  });
});

describe('profile assignment on apps and categories', () => {
  let profileId;

  beforeAll(async () => {
    const res = await createProfile({ name: 'assignments' });
    profileId = res.body.data.id;
  });

  it('accepts profileIds on app create and returns them on GET', async () => {
    const created = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .send({ name: 'ProfiledApp', url: 'p.local', profileIds: [profileId] });

    expect(created.status).toBe(201);
    expect(created.body.data.profileIds).toEqual([profileId]);

    const all = await request(api).get('/api/apps').set(authHeaders(token));
    const app = all.body.data.find((a) => a.name === 'ProfiledApp');
    expect(app.profileIds).toEqual([profileId]);
  });

  it('accepts profileIds as a JSON string (multipart form path)', async () => {
    const created = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .field('name', 'MultipartProfiled')
      .field('url', 'mp.local')
      .field('profileIds', JSON.stringify([profileId]));

    expect(created.status).toBe(201);
    expect(created.body.data.profileIds).toEqual([profileId]);
  });

  it('rejects malformed profileIds', async () => {
    const res = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .send({ name: 'BadIds', url: 'bad.local', profileIds: ['x', -1] });

    expect(res.status).toBe(400);
  });

  it('defaults to [] (visible everywhere) when omitted', async () => {
    const created = await request(api)
      .post('/api/categories')
      .set(authHeaders(token))
      .send({ name: 'Unassigned' });

    expect(created.status).toBe(201);
    expect(created.body.data.profileIds).toEqual([]);
  });

  it('deleting a profile scrubs its id from all assignments', async () => {
    const doomed = await createProfile({ name: 'doomedprofile' });
    const doomedId = doomed.body.data.id;

    const app = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .send({
        name: 'DoubleAssigned',
        url: 'd.local',
        profileIds: [profileId, doomedId],
      });
    const category = await request(api)
      .post('/api/categories')
      .set(authHeaders(token))
      .send({ name: 'DoomedCat', profileIds: [doomedId] });

    const del = await request(api)
      .delete(`/api/profiles/${doomedId}`)
      .set(authHeaders(token));
    expect(del.status).toBe(200);

    await settle();

    const appAfter = await request(api)
      .get(`/api/apps/${app.body.data.id}`)
      .set(authHeaders(token));
    expect(appAfter.body.data.profileIds).toEqual([profileId]);

    const categoriesAfter = await request(api)
      .get('/api/categories')
      .set(authHeaders(token));
    const cat = categoriesAfter.body.data.find((c) => c.name === 'DoomedCat');
    // scrubbed back to "visible everywhere", not left dangling
    expect(cat.profileIds).toEqual([]);
  });
});
