# Catalyst / Nexus OS

A local-first life planner with **left-side pages** for money, calendar, tasks, research, recipes, transit, outdoors, and life maintenance. It evolves the existing Phase 1 app using the supplied PDF, ZIP specifications, Gemini transcript, and animation fragments.

## Run the downloaded source

Install **Node.js 22.12 or newer** first. Extract the source ZIP, open a terminal inside its `Catalyst` folder, then run:

```sh
npm install --global pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm dev
```

Open the address printed in the terminal, usually **http://localhost:5173**. Keep that terminal running; Ctrl+C stops the app. Do not open `index.html` directly.

## Run from GitHub

This implementation is on `phase-2-complete-product`:

```sh
git clone --branch phase-2-complete-product https://github.com/Joshuza/Catalyst.git
cd Catalyst
pnpm install --frozen-lockfile
pnpm dev
```

For an existing clone, run `git fetch origin` and `git switch phase-2-complete-product`, then the last two commands. Commit or stash your own edits before switching branches.

## Start using it

Complete or skip the one-question-at-a-time setup. Configure actual pay dates, liquid savings, working shifts, walking limits, dietary preferences, reading sources, and optional pet care. Each page has local entry controls. Connections & privacy offers an explicitly labeled Sample workspace.

- **Financial Core:** income baseline, dotted scheduled cart, verified cash flow; drag or edit purchase dates, compare scenarios, reserve goal funds, and track subscription renewals.
- **Command, Calendar, Tasks:** Cmd/Ctrl+J previews purchases/reminders/tasks/notes. Calendar changes from 30-minute blocks to a working week. Small Steps supports manual plans, copied AI prompts, and an explicitly labeled Sample provider; approve before scheduling.
- **Receipts & reports:** drop text PDFs, PNG/JPEG screenshots, or receipt text. Optional English OCR runs on this device. Review uncertain matches, reconcile final costs, and download CSV/Excel expense or planning reports.
- **Research, Notes, Itineraries:** save images, links, quotes, pros/cons and priorities; plan researched purchases; keep notes; link original travel/event tickets to calendar entries and costs.
- **Food and outings:** scale recipes, subtract pantry stock, merge groceries, compare manually supplied routes, enforce walking/dietary limits, plan hikes, and add missing gear to the cart.
- **Life pages:** contacts and gift ideas, optional pet care, health reminders, habit check-ins, screen-time samples, saved audio, reading, and a three-step weekly reset.

Purchases scheduled for today or earlier require Bought, Postponed, or Canceled reconciliation. Logging a purchase or subscription charge **records an existing payment; it never sends money**. Receipt-printer, ticket, playing-card, dynamic-button, hold-to-delete, and magnetic-drop interactions are implemented with React and token-based CSS.

## Production and offline use

```sh
pnpm build
pnpm exec vite preview
```

Open the printed localhost address once with connectivity and let the service worker finish installing. The production shell, page code, PDF worker, and English OCR assets are cached for offline use. HTTPS or localhost is required for WebCrypto and service workers. Development mode does not install the production offline cache. Browser extensions/private mode may disable storage or service workers.

## Data and current limits

Data is stored in this browser's IndexedDB, not in a cloud account. Transactions, messages, profiles and product-module payloads are AES-GCM encrypted with a non-extractable device key. Notes, legacy task context, and recipes remain local plaintext. Encryption does not protect an unlocked browser or malicious same-origin code. Search stays in memory.

Export a JSON backup from **Notes & records → Data and backups** before clearing browser data or changing devices. Backups contain readable data, including soft-deleted records; keep them private. Restore imports are validated, limited to 128 MiB and 50,000 records, and undoable. Undo/redo history lasts for the current session.

The ZIP's v1 uses **manual inputs and labeled Sample adapters**. There is no connected bank, email/chat account, live maps/weather/trail service, OS screen-time sync, cloud sync, or AI API account. News uses saved links and imported RSS/Atom. Audio opens saved provider links. Ticket reminders link to original tickets; they are not valid boarding passes or entry codes. OCR is English-only and confidence is a heuristic, not a claimed accuracy guarantee. Full scope gaps and verification results are in [docs/PROGRESS.md](docs/PROGRESS.md).

## Development checks

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm e2e
```

An existing Chromium can be selected with `NEXUS_CHROMIUM_PATH=/path/to/chromium pnpm e2e`. See [NEXUS_OS.md](NEXUS_OS.md) for controls and [docs/DECISIONS.md](docs/DECISIONS.md) for architecture and dependency decisions. The source archive includes the exact lockfile and tests; installed packages and build output are excluded.
