# Nexus OS: Phase 1

The app now stores validated local records, encrypts transaction and message fields, supports undo and redo, and searches notes, tasks, transactions, messages and recipes. Spotlight opens with Cmd/Ctrl+K. The existing three Sample tiles remain part of the foundation canvas.

Onboarding, finance projections, purchase receipts, the calendar, inbox classification, task decomposition and the remaining modules are scheduled for later phases. A transaction in this build is a local record; it does not process a payment or calculate a financial projection.

## Run locally

Use Node 22.12 or newer and pnpm 11.19.0, pinned in package.json. From an existing clone:

```sh
git fetch origin
git switch phase-1-data-search
pnpm install --frozen-lockfile
pnpm dev
```

For a new clone, use `git clone --branch phase-1-data-search https://github.com/Joshuza/Catalyst.git`, then `cd Catalyst` and the pnpm commands above. If pnpm is unavailable, install the pinned version with `npm install --global pnpm@11.19.0`.

Open the URL printed by Vite, usually http://localhost:5173. To use the production build offline:

```sh
pnpm build
pnpm exec vite preview
```

Visit once online, wait for the service worker to install, then reload offline. Service workers and WebCrypto need HTTPS or localhost.

## Try the new tools

- Scroll to Local records. Create a note or transaction, save it, then reload to confirm persistence.
- Use Cmd/Ctrl+K or Search to open Spotlight. Enter opens the highlighted result; arrow keys choose another result; Tab reaches secondary actions. Escape closes and restores focus.
- Expand Data and backups to load clearly labeled Sample records. Try `receipt`, `receipts over $100 in October`, or `unread from Maria`.
- A receipt search includes related notes and messages. Arrow keys follow the visible groups; Tab starts at the selected record and then reaches its actions.
- Search `new task` for a minimal task record or `export October` for a month-filtered JSON backup.
- Edit a record, hold Enter/Space or the deletion button for 1.6 seconds, then undo. Early release or moving outside cancels the hold. Undo/redo history lasts for this visit; saved records survive reload.
- Export a JSON backup or import and merge a validated backup. Import is atomic and undoable. Exported files contain readable personal data and deleted records; keep them private. Limits are 20 MiB and 50,000 records.
- Remove sample data in one action. Your own records remain.

## Architecture and privacy

Dexie is the durable source of truth. Strict Zod schemas validate every core record read/write and portable backup. All record mutations go through the command bus and soft deletion. AES-GCM encrypts sensitive payload fields with a non-extractable device CryptoKey in IndexedDB. Routing metadata remains visible. This does not protect against malicious same-origin code or someone with access to an unlocked browser. A missing key is never silently replaced; unverifiable records remain untouched and are excluded from search with a visible notice.

MiniSearch indexes decrypted records in memory only. No search index or decrypted sensitive payload is persisted. No adapters, telemetry, remote fonts or runtime external requests are added. Theme remains the Phase 0 localStorage exception.

## Checks and specifications

Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm e2e`. Install Chromium with `pnpm exec playwright install chromium`, or set NEXUS_CHROMIUM_PATH to an existing executable. The cloud run used /usr/bin/chromium.

AGENTS.md, docs/REQUIREMENTS.md and docs/PHASE_PROMPTS.md are unchanged specifications. See docs/PROGRESS.md for the exact results and requirement map, and docs/DECISIONS.md for dependency sizes, encryption limits and animation adaptations. The 12-page UX guide is now available as user-pasted text; the original visual PDF was absent from both ZIPs.

Phase 1 adds the requested dynamic button and hold-to-delete interactions using React and token-based CSS. ReceiptPrinter, Ticket, PlayingCard and MagneticDropZone remain assigned to their relevant later phases. Review and merge Phase 1 before starting Phase 2.
