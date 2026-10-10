# Changelog

## Phase 0: Foundation

- Add the React 18 and Vite shell with three labeled Sample tiles.
- Add expand, collapse, and dim controls and responsive layout down to 360 px.
- Add local theme preferences, reduced-motion handling, contrast checks, and an error boundary.
- Add a PWA manifest, local icons, and verified offline shell caching.
- Add strict TypeScript, lint-enforced layers, deterministic clock and ULID utilities, unit tests, and browser flows.
- Retain the user's animation integration requirements for later phases.

## Phase 1: Data layer and search

- Save validated notes, minimal tasks, transactions, messages, recipes and settings in IndexedDB.
- Encrypt transaction and message payload fields locally, with tamper detection and a non-extractable device key.
- Preserve automatic snapshots before forward migrations; validate and merge portable JSON backups atomically.
- Undo and redo record changes, including soft deletion, imports and sample-data actions.
- Search offline with Cmd/Ctrl+K, grouped results, plain-language filters, and local quick actions.
- Add dynamic save buttons and the requested hold-to-delete gesture with pointer and keyboard cancellation.
