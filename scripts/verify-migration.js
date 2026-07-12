// Pre-deploy safety gate for the Umzug 2 -> 3 upgrade (Phase 1) and the new
// 06_profiles migration (Phase 3).
//
// The unit test in tests/migrations.test.js only proves Umzug 3 runs a set of
// migrations from an EMPTY database. It does NOT prove that the names Umzug 3
// derives match what Umzug 2 already recorded in a LIVE database's
// SequelizeMeta table. If they differ, Umzug 3 treats 00-05 as pending,
// re-runs createTable('config') etc., and connectDB() process.exit(1)s — the
// live app won't boot.
//
// Run this against a COPY of the production data dir before deploying:
//   1. scp the homelab's /app/data to ./verify-data (or any dir)
//   2. node scripts/verify-migration.js ./verify-data          # dry run
//   3. node scripts/verify-migration.js ./verify-data --apply  # apply + verify
//
// Dry run PASS: pending() is EXACTLY ['06_profiles.js'] — 00-05 recognized as
// already executed, only the new migration would run.
//
// --apply additionally runs the migration ON THE COPY and asserts that the
// new profileIds columns exist on apps + categories and that existing rows
// backfilled to '[]' (visible-in-every-profile). It mutates the copy, never
// production. Safe because you pointed it at a copy.
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');

const dataDir = process.argv[2];
const apply = process.argv.includes('--apply');

if (!dataDir) {
  console.error(
    'Usage: node scripts/verify-migration.js <path-to-data-dir> [--apply]'
  );
  process.exit(2);
}

const dbPath = path.join(dataDir, 'db.sqlite');

if (!fs.existsSync(dbPath)) {
  console.error(`No db.sqlite found at ${dbPath}`);
  process.exit(2);
}

const EXPECTED_ALREADY_RUN = [
  '00_initial.js',
  '01_new-config.js',
  '02_resource-access.js',
  '03_weather.js',
  '04_bookmarks-order.js',
  '05_app-description.js',
];
const EXPECTED_PENDING = ['06_profiles.js'];

(async () => {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
  });

  const umzug = new Umzug({
    migrations: {
      glob: ['db/migrations/*.js', { cwd: path.join(__dirname, '..') }],
      resolve: ({ name, path: migrationPath, context }) => {
        const migration = require(migrationPath);
        return {
          name,
          up: async () => migration.up(context),
          down: async () => migration.down(context),
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: undefined,
  });

  const [recorded] = await sequelize.query(
    'SELECT name FROM `SequelizeMeta` ORDER BY name ASC'
  );
  const recordedNames = recorded.map((r) => r.name);

  const pending = (await umzug.pending()).map((m) => m.name);

  console.log('Recorded in SequelizeMeta:', recordedNames);
  console.log('Umzug 3 sees pending:', pending);

  const alreadyRunOk = EXPECTED_ALREADY_RUN.every((n) =>
    recordedNames.includes(n)
  );
  const pendingOk =
    pending.length === EXPECTED_PENDING.length &&
    EXPECTED_PENDING.every((n) => pending.includes(n));

  if (!alreadyRunOk || !pendingOk) {
    await sequelize.close();
    console.error(
      '\nFAIL: migration names do not line up. If 00-05 show as pending, ' +
        'Umzug 3 would re-run them and the app would not boot. Add a name ' +
        'normalization to the resolve() shim in db/index.js before deploying.'
    );
    process.exit(1);
  }

  if (!apply) {
    await sequelize.close();
    console.log(
      '\nPASS (dry run): 00-05 recognized as executed; only 06_profiles.js ' +
        'would run. Re-run with --apply to actually migrate the copy and ' +
        'verify the new columns backfill.'
    );
    process.exit(0);
  }

  // --apply: run the migration on the copy and verify the schema change lands
  await umzug.up();

  const queryInterface = sequelize.getQueryInterface();
  const failures = [];

  for (const table of ['apps', 'categories']) {
    const columns = await queryInterface.describeTable(table);
    if (!columns.profileIds) {
      failures.push(`${table}.profileIds column was not created`);
      continue;
    }

    // existing rows must backfill to the '[]' default (visible everywhere)
    const [rows] = await sequelize.query(
      `SELECT profileIds FROM \`${table}\` LIMIT 1`
    );
    if (rows.length && rows[0].profileIds !== '[]') {
      failures.push(
        `${table} existing row backfilled to ${JSON.stringify(
          rows[0].profileIds
        )}, expected '[]'`
      );
    }
  }

  await sequelize.close();

  if (failures.length) {
    console.error('\nFAIL (apply):');
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  }

  console.log(
    '\nPASS (apply): 06_profiles.js migrated the copy cleanly; profileIds ' +
      "columns exist on apps + categories and existing rows backfilled to '[]'."
  );
  process.exit(0);
})();
