// vitest setupFile — runs in every forked test process BEFORE the test file
// is imported. Chdirs into an isolated scratch dir so all cwd-relative
// server paths (data/db.sqlite, data/config.json, data/uploads) stay out of
// the repository working tree, and sets the auth env the server requires.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prepareScratch = require('./prepareScratch.js');

process.env.NODE_ENV = 'test';
process.env.PASSWORD = 'test-password-123';
// db/utils/slugify.js derives the DB-backup filename from VERSION and
// crashes when it is unset (production reads it from the committed .env,
// which the scratch cwd deliberately does not have).
process.env.VERSION = '2.4.0';
// Setting SECRET explicitly makes utils/init/initSecret.js a no-op, so the
// test run never writes a data/.secret file into the repository.
process.env.SECRET = 'flame-vitest-secret';

prepareScratch('flame-vitest-');
