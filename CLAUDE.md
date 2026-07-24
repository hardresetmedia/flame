# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A HardReset Media fork of [pawelmalak/flame](https://github.com/pawelmalak/flame) — a self-hosted browser startpage (Node/Express + Sequelize/SQLite serving a React SPA). Upstream is dormant; **this fork has deliberately diverged and is not meant to merge back**, so prefer modern idioms over upstream-compatibility. The fork's headline additions over v2.4.0 are documented in the README's "HardReset Media fork" section: full toolchain modernization, security hardening, and a **URL-driven profiles** feature with an auto-activation rules engine.

## Commands

The repo is two npm packages: the server at the root, the client under `client/`.

```sh
npm test                      # server API integration tests (vitest + supertest)
npm test -- tests/apps.test.js # a single server test file
npm test --prefix client      # client unit tests (rules engine, cidr, filters, hash)
npm run build:client          # tsc + vite build, copied into public/ (Docker/e2e depend on this)
npm run test:e2e              # Playwright (needs a prior build:client)
npm run dev                   # concurrent nodemon server (:5005) + vite client (:3000, proxies to :5005)
```

There is no lint step. `PASSWORD` and `VERSION` must be set for the server to run (see gotchas). Before deploying, run `node scripts/verify-migration.js <copy-of-prod-data> --apply` — this is a required gate (see Migrations).

## Server architecture

- **`api.js` exports the Express app without listening**; `server.js` wraps it in a raw `http.Server` so the same server also handles the weather WebSocket (`Socket.js` / `Sockets.js`, path `/socket`, push-only, no auth). Startup order in `server.js`: `initApp()` (seed files/config/secret) → `connectDB()` (backup + auto-run migrations) → `associateModels()` → `jobs()` (node-schedule weather cron).
- **Controllers are one function per file** under `controllers/<resource>/`, barrel-exported via `index.js`, wired in `routes/<resource>.js`. Every controller is wrapped in `middleware/asyncWrapper.js` so rejected promises reach `middleware/errorHandler.js`.
- **Two-tier auth**: `middleware/auth.js` is *soft* — it verifies the `Authorization-Flame: Bearer <token>` header and sets `req.isAuthenticated` but never rejects, so public GETs stay public but become auth-aware. `middleware/requireAuth.js` is the hard gate on writes. Login (`controllers/auth/login.js`) is a single shared password (`process.env.PASSWORD`, constant-time compare, refuses unset/default values), issuing a JWT signed with a secret auto-generated into `data/.secret`.
- **`isPublic` filtering** happens in the GET controllers: `where` is `{}` when authenticated, `{ isPublic: true }` otherwise; categories additionally post-filter their bookmarks for anonymous callers.
- **Write payloads are allow-listed** — never spread `req.body` into a model or config. Use `utils/pick.js` with the lists in `utils/writableFields.js` (and `utils/configKeys.js` for config). This is a hardening invariant; follow it for any new write path.

## The config trap

Runtime config is a **single flat JSON file `data/config.json`**, NOT a database table. `models/Config.js` and the `config` DB table are **dead code** — migration `01` copies the table into the JSON file and drops it. Anything that "adds a setting to the DB" is wrong. Config flows: defaults in `utils/init/initialConfig.json` → `utils/loadConfig.js` reads/merges-new-keys → `controllers/config/getConfig.js` redacts to `PUBLIC_CONFIG_KEYS` for anonymous callers (secrets like `WEATHER_API_KEY` are auth-only) → the client mirrors it in the `config` reducer. Adding a config key touches several files (`initialConfig.json`, `client/src/interfaces/Config.ts`, `client/src/utility/templateObjects/configTemplate.ts`, plus `utils/configKeys.js` for exposure and any Settings form).

## Migrations (highest-risk area)

`db/migrations/NN_name.js` export `up(queryInterface)`/`down(queryInterface)` and **auto-run on every boot** via Umzug 3 (`db/index.js` uses a `resolve` shim so the migration files keep their v2-style signature). `connectDB()` backs up the DB first, then `process.exit(1)`s on any migration error — a bad migration takes the app down.

- **Migration names include the `.js` extension** (`00_initial.js`…) and MUST match what a live DB's `SequelizeMeta` recorded, or Umzug re-runs old migrations against production. `tests/migrations.test.js` pins this from empty; `scripts/verify-migration.js` is the cross-version + apply gate against a copy of real data.
- **JSON column defaults must be an actual value, not a string.** `defaultValue: '[]'` on a JSON column double-encodes to `'"[]"'` and existing rows backfill malformed. Use `defaultValue: []` (there's a regression guard in `tests/migrations.test.js`).

## Client architecture

Vite + React 18 + TypeScript 5, **classic Redux 4 + redux-thunk (NOT Redux Toolkit)**. `react-router-dom` v6 with `BrowserRouter`. CSS Modules. Theme = 3 CSS custom properties (`--color-{primary,accent,background}`) set on `document.body`, persisted to `localStorage.theme` as a `primary;accent;background` "PAB" string.

- **Redux is hand-rolled**: to add a slice you touch `store/action-types/index.ts`, `store/actions/`, `store/action-creators/`, `store/reducers/`, and register in `reducers/index.ts`. Follow the existing profile slice as the template.
- **Boot happens at `App.tsx` module scope** (before render): dispatches `getConfig()`, `getProfiles()`, `fetchClientHints()`, and `autoLogin()` if a token exists. Data fetches (`getApps`/`getCategories`) also fire from the auth action-creators.
- **`applyAuth()`** (`utility/applyAuth.ts`) attaches the `Authorization-Flame` header; use it on every authenticated request.

## The profiles feature

URL-driven profiles (`#!/novastream`, `#!/laptop`…) scope which apps/bookmark-categories show, plus optional per-profile theme and settings overrides.

- **Storage**: a `profiles` table + JSON `profileIds` int-array columns on `apps` and `categories` (bookmarks inherit their category). Empty `profileIds` = visible in every profile. `deleteProfile` scrubs the id from all assignments (required for correctness, not just tidiness).
- **Filtering is render-time, not server-side** — `utility/profileFilter.ts` (`visibleInProfile`) applied in `Home.tsx`, `Apps.tsx`, `Bookmarks.tsx`, mirroring the existing `isPinned` pattern. Management tables stay unfiltered. Switching a profile is a pure Redux state change; never refetch. `/api/profiles` GET is intentionally public (rules resolve before login).
- **Config-override merge lives in the config reducer**: `baseConfig` is server truth; `config` = `baseConfig + activeOverrides`. The ~30 existing `config` consumers stay untouched; Settings forms read `baseConfig` so overrides are never saved back.
- **Resolution** (`hooks/useProfileResolver.ts`, mounted once in `App.tsx`) is the single authority for the active profile AND the effective theme. Precedence: `#!/hash` > matched rule > remembered choice (`localStorage.lastProfile`) > `isDefault` profile > base view. It re-runs on boot and on `hashchange` (live switching, no reload) — never on resize/clock tick.
- **Rules engine** (`utility/rulesEngine.ts`, pure + unit-tested): conditions AND within a rule, rules OR within a profile, profiles evaluated in `orderId` order (drag-order = precedence). Signals from `utility/deviceSignals.ts` (device class/touch/battery are best-effort; viewport/IP/time are reliable) and the CF-aware client IP from `GET /api/client-hints`. A null signal never satisfies a condition testing it.

## Test harness notes

- Server tests run each file in a forked process that `process.chdir()`s into a temp dir (`tests/prepareScratch.js`) so nothing touches the repo's `data/`. `tests/helpers.js#bootApp` returns a base URL from an explicit `127.0.0.1` listener (supertest's default `0.0.0.0` bind can be refused in sandboxes).
- Tests set `VERSION` because `db/utils/slugify.js` derives the DB-backup filename from it and crashes when unset.
- Client unit tests are pure-utility only (`src/**/*.test.ts`, jsdom); component/integration coverage lives in the root Playwright e2e suite, which shares one server + DB and runs files alphabetically (specs are numbered `0-`, `1-`, `2-` to keep the empty-state smoke test first).

## Deploy

Non-root container (`USER node`, uid 1000) — the host `data/` bind-mount must be `chown -R 1000:1000` before first run or boot fails at the backup step. `PASSWORD` is required (no default; `flame_password`/`change_me` are refused). The Docker image build itself needs a host with the daemon. Build both Dockerfiles (`.docker/Dockerfile`, `.docker/Dockerfile.multiarch`) — the client stage installs its devDeps (vite/tsc), unlike the server's `--production` install.
