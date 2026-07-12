const { Sequelize } = require('sequelize');
const { join } = require('path');
const { Umzug, SequelizeStorage } = require('umzug');

// Utils
const backupDB = require('./utils/backupDb');
const Logger = require('../utils/Logger');
const logger = new Logger();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/db.sqlite',
  logging: false,
});

// Umzug 3. The resolve shim adapts the existing migration files, which
// export up(queryInterface)/down(queryInterface). Migration names are the
// file basenames INCLUDING the .js extension — this must never change:
// it is what Umzug 2 historically recorded in SequelizeMeta, and a name
// mismatch would re-run old migrations against live databases
// (tests/migrations.test.js pins this).
const umzug = new Umzug({
  migrations: {
    glob: ['migrations/*.js', { cwd: __dirname }],
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

const connectDB = async () => {
  try {
    backupDB();

    await sequelize.authenticate();

    // execute all pending migrations
    const pendingMigrations = await umzug.pending();

    if (pendingMigrations.length > 0) {
      logger.log('Executing pending migrations');
      await umzug.up();
    }

    logger.log('Connected to database');
  } catch (error) {
    logger.log(`Unable to connect to the database: ${error.message}`, 'ERROR');
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  sequelize,
};
