// Launches the Flame server inside an isolated scratch working directory,
// used as the Playwright webServer command (playwright.config.ts). The
// scratch cwd keeps the e2e run's SQLite DB / config.json out of the repo;
// the built client is still served from the repo's public/ because api.js
// resolves static paths via __dirname, not cwd.
const fs = require('fs');
const path = require('path');

const prepareScratch = require('../tests/prepareScratch');

// utils/init/initFiles.js writes seed files via __dirname (repo-absolute),
// so the repo-level data/ dir must exist — normally `npm run dir-init` or
// the Docker volume provides it. It is gitignored either way.
fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });

prepareScratch('flame-e2e-');

require('../server');
