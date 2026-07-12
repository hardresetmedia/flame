// Creates an isolated working directory that mimics the layout Flame's
// server code expects relative to process.cwd() (data/, utils/init/*.json),
// then chdirs into it. Written by the test tooling, used by both the vitest
// setup file (tests/setup.js) and the Playwright server launcher
// (e2e/start-server.js) so tests never touch the repository's real data/.
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

const prepareScratch = (prefix) => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), prefix));

  fs.mkdirSync(path.join(scratch, 'data'));
  fs.mkdirSync(path.join(scratch, 'utils', 'init'), { recursive: true });

  // initConfig() copies 'utils/init/initialConfig.json' via a cwd-relative
  // path and normalizeTheme() reads 'utils/init/themes.json' the same way.
  for (const file of ['initialConfig.json', 'themes.json']) {
    fs.copyFileSync(
      path.join(REPO_ROOT, 'utils', 'init', file),
      path.join(scratch, 'utils', 'init', file)
    );
  }

  // The themes/queries controllers read these via cwd-relative paths.
  // In production utils/init/initFiles.js seeds them; it writes via
  // __dirname (repo-absolute), so we seed the scratch copies here instead.
  fs.copyFileSync(
    path.join(REPO_ROOT, 'utils', 'init', 'themes.json'),
    path.join(scratch, 'data', 'themes.json')
  );
  fs.writeFileSync(
    path.join(scratch, 'data', 'customQueries.json'),
    JSON.stringify({ queries: [] })
  );

  process.chdir(scratch);

  return scratch;
};

module.exports = prepareScratch;
