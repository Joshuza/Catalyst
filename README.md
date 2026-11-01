# Catalyst

A local-first life planner with **left-side pages** for money, calendar, tasks, research, recipes, transit, outdoors, and life maintenance. It evolves the existing Phase 1 app using the supplied PDF, ZIP specifications, Gemini transcript, and animation fragments.

## Run the downloaded source

Install **Node.js 22.12 or newer** first. Extract the source ZIP and open a terminal in the extracted folder containing `package.json`, then run:

```sh
npm install --global pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm dev
```

Open the address printed in the terminal, usually **http://localhost:5173**. Keep that terminal running; Ctrl+C stops the app. Do not open `index.html` directly.

## Run from GitHub

The rejected expandable-widget experiment has been reverted on `phase-2-expandable-widgets`. This branch restores the previous neutral interface, full left sidebar, animated survey and event-based graph:

```sh
git clone --branch phase-2-expandable-widgets https://github.com/Joshuza/Catalyst.git
cd Catalyst
pnpm install --frozen-lockfile
pnpm dev
```

For an existing clone, run `git fetch origin`, `git switch phase-2-expandable-widgets` and `git pull --ff-only`, then the last two commands. Commit or stash your own edits before switching branches. Previously saved widget layout metadata remains readable for data compatibility and does not enable the rejected interface.

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

## Startup survey

Every reload opens the archival survey with your saved answers prefilled. Scroll through the questions as a house blueprint draws over the oasis scene, then reveals the full nectarine painting. Choose **Begin survey** on first launch, or **Review my answers** later. Returning users can choose **Continue with saved answers**. One question is open at a time across money, time, mobility and lifestyle. **Continue** validates and saves; questions passed by scrolling are collected into the weekly reset. There are 19 answer screens, plus review (20 answers for irregular pay). Reduced motion shows static finished artwork.

Add monthly bills with their next due dates to see their effect on the dotted financial line. The actual line still requires verified transactions. Choose a role, working hours, default calendar scale, walking ceiling, public modes, reading interests and optional pet-care intervals. Your existing records remain intact.

**Export survey JSON** downloads a validated, versioned state file containing all responses and explicit defaults. Initialization displays **Initializing Catalyst Command Engine...** for three seconds while presenting the computed financial curves, working-hour mask and local news/transit rules. This is the app's local engine; external accounts remain opt-in/manual. Use **Profile & preferences** to edit these choices later.

The oasis/nectarine illustration and open-license fonts are bundled locally and available offline after the first production visit. Artwork and font provenance: [src/assets/README.md](src/assets/README.md).

The supplied pear.no HTML informed the chapter rail, fine ruled frame, corner ornaments and editorial scale. Its linked stylesheet, scripts and films were not attached; this is a working adaptation with original artwork and local fonts.

## Capture and a quieter dashboard

**Add new** is a dedicated sidebar page for purchases, tasks, events, notes, research and subscriptions. Save one entry at a time, then open it in its destination page. Purchases show the receipt animation and update the simulated cart; they do not send money. Events respect protected working hours. Other creation tools, including recipes, receipts, goals, contacts and trips, are linked under **Add something else**.

Briefing starts with three soft squircle cards for money, the next three events and inbox counts. Its money card shows your available balance, unbought cart total for the next 30 days and a visible graph. Use **More for today** for reading/tasks/weekend sections and **Customize dashboard** for pin/hide/detail controls. Urgent alerts, catch-up and pinned sections remain visible. Deep work still suppresses reading and promotions.

The graph holds balances flat between events and jumps on the actual date of an expected deposit, scheduled purchase/bill or recorded transaction. **Dotted blue** is the projected cart balance, including purchases not bought yet; the actual line changes only from recorded transactions. A wishlist item has no impact until planned. When bought, the item leaves the unbought count, its final cost remains in the projection, and its transaction affects actual once. Hover the graph, or focus it and press Left/Right, to read all three balances. Financial Core still supports dragging purchase markers and editing dates. Resizing changes the graph layout, not the balances.

The visible product and downloaded filenames are now **Catalyst**. Existing database identifiers, theme keys and version-1 backup/survey format identifiers retain their legacy names so saved data and old backups remain usable.

## Interface and motion

Catalyst uses neutral white/silver and graphite surfaces with restrained blue controls across the app, survey and installed icon. Original line icons, system typography, rounded controls and squircle cards give all pages a consistent hierarchy. The original nectarine/oasis artwork remains in the survey.

Begin, Back and Continue position the next question immediately, then reveal its content with a short fade and rise. Native wheel/touch/keyboard scrolling stays free, and the blueprint-to-painting scene follows your scroll. Pages, capture forms, dashboard cards and dialogs enter with short finite transitions. No animation loops on the financial graph: its three lines still hold between events and jump on event dates, with the unbought cart dotted blue. System reduced motion makes the new transitions immediate and removes stagger delays. The requested three-second initialization remains a processing stage.
