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
//   2. node scripts/verify-migration.js ./verify-data
//
// PASS criterion: pending() is EXACTLY ['06_profiles.js'] — i.e. 00-05 are
// recognized as already executed and only the new migration runs.
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');

const dataDir = process.argv[2];

if (!dataDir) {
  console.error('Usage: node scripts/verify-migration.js <path-to-data-dir>');
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

  await sequelize.close();

  if (alreadyRunOk && pendingOk) {
    console.log(
      '\nPASS: 00-05 recognized as executed; only 06_profiles.js will run.'
    );
    process.exit(0);
  }

  console.error(
    '\nFAIL: migration names do not line up. If 00-05 show as pending, ' +
      'Umzug 3 would re-run them and the app would not boot. Add a name ' +
      'normalization to the resolve() shim in db/index.js before deploying.'
  );
  process.exit(1);
})();
