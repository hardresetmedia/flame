/// <reference types="vite/client" />

// Injected at build time via `define` in vite.config.ts (single-sourced
// from client/package.json "version").
interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
