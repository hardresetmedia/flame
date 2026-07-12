// Locks the hardened icon-upload pipeline: server-generated filenames,
// extension+mimetype allow-list, magic-byte content validation, size limit
// and in-place SVG sanitization (stored-XSS defense).
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import request from 'supertest';
import { bootApp, loginAndGetToken, authHeaders } from './helpers.js';

let api;
let token;

// Minimal PNG header + padding; enough for the magic-byte check.
const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64),
]);

beforeAll(async () => {
  api = await bootApp();
  token = await loginAndGetToken(api);
});

describe('icon uploads', () => {
  it('accepts a png icon, stores it under a server-generated name', async () => {
    const res = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .field('name', 'WithIcon')
      .field('url', 'icon.local')
      .attach('icon', PNG_BYTES, 'icon.png');

    expect(res.status).toBe(201);
    // nothing of the original filename survives except the extension
    expect(res.body.data.icon).toMatch(/^\d+-[0-9a-f]{12}\.png$/);

    const stored = fs.readdirSync('data/uploads');
    expect(stored).toContain(res.body.data.icon);
  });

  it('rejects unsupported file types with 400', async () => {
    const res = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .field('name', 'WithBadIcon')
      .field('url', 'bad.local')
      .attach('icon', Buffer.from('MZ-not-an-image'), 'evil.exe');

    expect(res.status).toBe(400);
  });

  it('rejects a file whose content does not match its extension', async () => {
    const before = fs.readdirSync('data/uploads').length;

    const res = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .field('name', 'FakePng')
      .field('url', 'fake.local')
      .attach('icon', Buffer.from('just some text, no png magic'), 'fake.png');

    expect(res.status).toBe(400);
    // the offending file was deleted again
    expect(fs.readdirSync('data/uploads').length).toBe(before);
  });

  it('sanitizes script content out of uploaded SVGs', async () => {
    const dirtySvg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">' +
        '<script>alert("xss")</script><circle r="4" /></svg>'
    );

    const res = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .field('name', 'SvgIcon')
      .field('url', 'svg.local')
      .attach('icon', dirtySvg, { filename: 'icon.svg', contentType: 'image/svg+xml' });

    expect(res.status).toBe(201);

    const stored = fs.readFileSync(`data/uploads/${res.body.data.icon}`, 'utf-8');
    expect(stored).toContain('<circle');
    expect(stored).not.toContain('<script');
    expect(stored).not.toContain('onload');
  });

  it('rejects uploads over the 2 MB size limit', async () => {
    const huge = Buffer.concat([PNG_BYTES, Buffer.alloc(2 * 1024 * 1024)]);

    const res = await request(api)
      .post('/api/apps')
      .set(authHeaders(token))
      .field('name', 'HugeIcon')
      .field('url', 'huge.local')
      .attach('icon', huge, 'huge.png');

    expect(res.status).toBe(400);
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
