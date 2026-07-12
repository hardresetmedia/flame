// Locks the migration bootstrap: all migrations run from empty, are recorded
// in SequelizeMeta under their exact filenames, and produce the expected
// schema. This is the regression net for the Umzug 2 → 3 move — if the
// recorded names ever mismatch, migrations would re-run against real DBs.
import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'node:module';
import { bootApp } from './helpers.js';

const require = createRequire(import.meta.url);

let sequelize;

beforeAll(async () => {
  await bootApp();
  ({ sequelize } = require('../db'));
});

describe('database migrations', () => {
  it('records every migration in SequelizeMeta in order, with .js extensions', async () => {
    const [rows] = await sequelize.query(
      'SELECT name FROM `SequelizeMeta` ORDER BY name ASC'
    );

    expect(rows.map((r) => r.name)).toEqual([
      '00_initial.js',
      '01_new-config.js',
      '02_resource-access.js',
      '03_weather.js',
      '04_bookmarks-order.js',
      '05_app-description.js',
      '06_profiles.js',
    ]);
  });

  it('creates the live tables and drops the legacy config table', async () => {
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const names = tables.map((t) => t.name);

    for (const expected of [
      'apps',
      'bookmarks',
      'categories',
      'weather',
      'profiles',
    ]) {
      expect(names).toContain(expected);
    }
    // dropped by migration 01_new-config.js
    expect(names).not.toContain('config');
  });

  it('booting again reports no pending migrations', async () => {
    // connectDB() already ran in bootApp(); a second run must be a no-op.
    const { connectDB } = require('../db');
    await connectDB();

    const [rows] = await sequelize.query(
      'SELECT COUNT(*) AS count FROM `SequelizeMeta`'
    );
    expect(rows[0].count).toBe(7);
  });
});
