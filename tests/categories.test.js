// Locks the behavior of /api/categories and /api/bookmarks, including the
// per-category private-bookmark filtering for anonymous requests.
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { bootApp, loginAndGetToken, authHeaders, settle } from './helpers.js';

let api;
let token;

beforeAll(async () => {
  api = await bootApp();
  token = await loginAndGetToken(api);
});

const createCategory = async (body) => {
  const res = await request(api)
    .post('/api/categories')
    .set(authHeaders(token))
    .send(body);
  expect(res.status).toBe(201);
  return res.body.data;
};

const createBookmark = async (body) => {
  const res = await request(api)
    .post('/api/bookmarks')
    .set(authHeaders(token))
    .send(body);
  expect(res.status).toBe(201);
  return res.body.data;
};

describe('/api/categories + /api/bookmarks', () => {
  it('creates a category pinned by default', async () => {
    const category = await createCategory({ name: 'Dev' });

    // initialConfig.json ships pinCategoriesByDefault: true
    expect(category.isPinned).toBe(true);
    expect(category.isPublic).toBe(1);
  });

  it('hides private categories from anonymous requests', async () => {
    await createCategory({ name: 'HiddenCat', isPublic: false });

    const anon = await request(api).get('/api/categories');
    const authed = await request(api)
      .get('/api/categories')
      .set(authHeaders(token));

    expect(anon.body.data.map((c) => c.name)).not.toContain('HiddenCat');
    expect(authed.body.data.map((c) => c.name)).toContain('HiddenCat');
  });

  it('filters private bookmarks out of public categories for anonymous requests', async () => {
    const category = await createCategory({ name: 'Mixed' });
    await createBookmark({
      name: 'PublicMark',
      url: 'pub.local',
      categoryId: category.id,
    });
    await createBookmark({
      name: 'PrivateMark',
      url: 'priv.local',
      categoryId: category.id,
      isPublic: false,
    });

    const anon = await request(api).get('/api/categories');
    const anonMixed = anon.body.data.find((c) => c.name === 'Mixed');
    expect(anonMixed.bookmarks.map((b) => b.name)).toEqual(['PublicMark']);

    const authed = await request(api)
      .get('/api/categories')
      .set(authHeaders(token));
    const authedMixed = authed.body.data.find((c) => c.name === 'Mixed');
    expect(authedMixed.bookmarks.map((b) => b.name).sort()).toEqual([
      'PrivateMark',
      'PublicMark',
    ]);
  });

  it('GET /api/bookmarks hides private bookmarks from anonymous requests', async () => {
    const anon = await request(api).get('/api/bookmarks');

    expect(anon.body.data.map((b) => b.name)).not.toContain('PrivateMark');
    expect(anon.body.data.map((b) => b.name)).toContain('PublicMark');
  });

  it('deleting a category also deletes its bookmarks', async () => {
    const category = await createCategory({ name: 'Doomed' });
    const bookmark = await createBookmark({
      name: 'DoomedMark',
      url: 'doom.local',
      categoryId: category.id,
    });

    const del = await request(api)
      .delete(`/api/categories/${category.id}`)
      .set(authHeaders(token));
    expect(del.status).toBe(200);

    // deleteCategory fires bookmark deletes without awaiting them
    await settle();

    const bookmarks = await request(api)
      .get('/api/bookmarks')
      .set(authHeaders(token));
    expect(bookmarks.body.data.map((b) => b.id)).not.toContain(bookmark.id);
  });
});
