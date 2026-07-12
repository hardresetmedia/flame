// Single source of truth for config-key exposure levels. Written for the
// hardening pass: GET /api/config is public (the client needs layout/search/
// theme settings before login), so anything not explicitly listed as public
// stays authenticated-only — most importantly WEATHER_API_KEY, coordinates
// and the Docker/Kubernetes integration settings.
const initialConfig = require('./init/initialConfig.json');

// Every key that may exist in data/config.json. updateConfig filters incoming
// payloads against this list so clients cannot inject arbitrary keys.
const ALL_CONFIG_KEYS = Object.keys(initialConfig);

// Safe for unauthenticated GET /api/config responses.
const PUBLIC_CONFIG_KEYS = [
  'customTitle',
  'hideHeader',
  'useOrdering',
  'appsSameTab',
  'bookmarksSameTab',
  'searchSameTab',
  'hideApps',
  'hideCategories',
  'hideSearch',
  'defaultSearchProvider',
  'secondarySearchProvider',
  'useAmericanDate',
  'disableAutofocus',
  'greetingsSchema',
  'daySchema',
  'monthSchema',
  'showTime',
  'hideDate',
  'defaultTheme',
  'isCelsius',
  'isKilometer',
  'weatherData',
];

// Keys a profile may override client-side (see the profiles feature). Kept
// here so the server can validate profile.overrides payloads with it.
const OVERRIDABLE_CONFIG_KEYS = [
  'customTitle',
  'hideHeader',
  'hideApps',
  'hideCategories',
  'hideSearch',
  'hideDate',
  'showTime',
  'defaultSearchProvider',
  'appsSameTab',
  'bookmarksSameTab',
  'searchSameTab',
  'useOrdering',
];

module.exports = {
  ALL_CONFIG_KEYS,
  PUBLIC_CONFIG_KEYS,
  OVERRIDABLE_CONFIG_KEYS,
};
