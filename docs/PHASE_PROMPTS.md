# Nexus OS: Codex Phase Prompts

## How to use these

1. Create an empty git repository. Add three things before the first run:
   - `AGENTS.md` at the repository root
   - `docs/REQUIREMENTS.md`
   - `docs/spec/Nexus_OS_UX_Specification_Visual.pdf` (the PDF, for reference)
2. Open `AGENTS.md` and check the stack table in section 3. Change it now if you want a different stack. Changing it later is expensive.
3. Run the **Preflight** prompt first. It changes no code. Read the plan and answer any questions.
4. Run the phases **in order, one per Codex run**. Start each run from a clean working tree on the default branch.
5. After every run, read the report, run the "How to verify by hand" steps, and merge the branch yourself only when you are satisfied. Do not start the next phase until you have merged.
6. If a run goes wrong, use the **Audit** or **Targeted fix** prompts at the bottom instead of asking Codex to "try again".

Every phase prompt below begins with the same shared header so that Codex never has to guess its boundaries. Paste the header and the phase body together.

---

## Shared header (paste at the top of every phase run)

```
You are working in the Nexus OS repository.

Before doing anything else:
1. Read AGENTS.md completely. It is binding.
2. Read docs/REQUIREMENTS.md completely.
3. Read docs/PROGRESS.md and docs/DECISIONS.md if they exist.
4. Run `git status` and confirm the working tree is clean. If it is not clean, stop and report.

Rules for this run:
- Do exactly the one phase described below and nothing else.
- Create the branch named in the phase. Do not touch main.
- Do not change or remove anything built in an earlier phase unless this prompt says so. Extend additively.
- Do not add features that are not in docs/REQUIREMENTS.md.
- If anything is ambiguous and not covered by AGENTS.md section 9, choose the most conservative reading, record it in docs/DECISIONS.md, and flag it in your report.
- If something blocks you, stop and report. Do not work around it.
- Run typecheck, lint, unit tests, build, and e2e yourself, and report the real results.
- End with the report format from AGENTS.md section 10.
```

---

## Preflight (read only, no code changes)

```
Read AGENTS.md, docs/REQUIREMENTS.md, and the PDF in docs/spec/. Do not create or modify any file except docs/PLAN.md.

Produce docs/PLAN.md containing:
1. A one-paragraph restatement of the product in your own words.
2. A table mapping every requirement ID to the phase (0 to 12) that will implement it, using the phase list I give you below. Flag any requirement that fits no phase or fits two.
3. A list of every contradiction, gap, or ambiguity you found between AGENTS.md, REQUIREMENTS.md, and the PDF, each with the default you would choose and why.
4. The risks you see in the default stack and any dependency you think will be hard to install or use offline.
5. The five requirements you consider hardest to get right and your approach to each.
6. Questions for the human, ordered by how much they block progress.

Phase list: 0 Foundation, 1 Data layer and search, 2 Onboarding, 3 Financial simulator and sentinel, 4 Survey and receipts, 5 Command terminal and calendar, 6 Tri-fold inbox, 7 Tasks and AI decomposer, 8 Recipes, grocery, transit, 9 Hikes and activities, 10 Pet, CRM, screen time, Sunday Reset, 11 Morning briefing and progressive disclosure, 12 Hardening.

Do not write any application code in this run.
```

---

## Phase 0: Foundation

```
BRANCH: phase-0-foundation

GOAL: A working, empty, well-tooled application shell. No product features yet.

BUILD:
- pnpm project with the stack in AGENTS.md section 3. Exact pinned versions. Lockfile committed.
- tsconfig with strict settings from AGENTS.md. Vite, ESLint, Prettier, Vitest, Playwright configured. Scripts: typecheck, lint, test, build, e2e, dev.
- The folder layout from AGENTS.md section 4.1, with a README.md in each top-level folder of src/ stating what belongs there.
- An ESLint rule (for example eslint-plugin-boundaries or no-restricted-imports) that enforces the one-way layer dependencies. Add a test file that deliberately violates it and confirm lint fails on it, then remove the test file.
- src/ui/tokens.css: design tokens for color, spacing, radius, type scale, elevation, and motion, with light and dark themes and a prefers-reduced-motion override. No hard-coded values in components afterwards.
- App shell: a single tiled canvas using CSS grid, a Tile component with collapsed, expanded, and dimmed states, and an empty canvas that shows three placeholder tiles labeled "Sample". The shell must be responsive down to 360 px.
- A Clock interface in domain with a system implementation and a fixed implementation for tests.
- A ULID generator in one module.
- A Result type and a NotImplementedError class in domain.
- An error boundary and a plain, calm error screen.
- PWA manifest and a service worker that caches the app shell for offline use. Keep it minimal.
- Settings for theme (system, light, dark) stored in localStorage only, since the database does not exist yet.
- docs/DECISIONS.md and docs/PROGRESS.md initialized. CHANGELOG.md initialized.

OUT OF SCOPE: any database, any finance logic, any module UI beyond the placeholder tiles, any adapter.

ACCEPTANCE:
- All quality gates in AGENTS.md section 6 pass.
- One Playwright test loads the app, asserts three tiles render, toggles dark mode, and asserts reduced-motion behavior by emulating the media feature.
- A unit test proves the layer-boundary lint rule works.
- A contrast test covers the text and background token pairs in both themes at AA.
```

---

## Phase 1: Data layer, command infrastructure, and global search

```
BRANCH: phase-1-data-search

GOAL: Durable local storage, undoable commands, encryption at rest, and Cmd/Ctrl+K search over stored records.

REQUIREMENTS: UX-04 (search shortcut only), UX-05, UX-07, SRCH-01 through SRCH-06.

BUILD:
- Dexie schema and repositories for the core record types needed so far: Note, Task (minimal shape), Transaction, Message, Recipe (minimal shape), and a Settings record. Every record has id, createdAt, updatedAt, schemaVersion, deletedAt. Define Zod schemas for each and validate on every read and write.
- Money in integer cents, dates as specified in AGENTS.md section 4.2. Add a money module (parse, format, add, subtract) with property-based tests proving no float is ever used.
- A migration framework: forward-only, versioned, writes an automatic export snapshot before running, tested with a fixture database.
- A Vault interface and a WebCrypto AES-GCM implementation for sensitive fields. Non-extractable key in IndexedDB. Test encrypt and decrypt round trip, tamper detection, and behavior when the key is missing. Write the honest threat-model note in docs/DECISIONS.md.
- A command bus: each mutation is a command returning new state and an inverse patch. A history stack supports undo and redo (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z) and an undo toast of about 5 seconds.
- Export and import of the whole database as one JSON file, validated with Zod, size capped, and never executed.
- A search engine module using MiniSearch, built in memory at startup from decrypted records. Never persisted. It supports result grouping by type and the plain-language filters from SRCH-04: amount comparisons, month names, "unread", "from <name>".
- The Spotlight UI: opens on Cmd/Ctrl+K, focus trapped, results update as the user types, grouped by type, Enter opens the top result, Tab reveals secondary actions, Escape closes and restores focus.
- A visible shortcuts list reachable from the shell.
- A labeled "Load sample data" action that inserts a small fixture set and a matching "Remove sample data" action that removes exactly those records.

OUT OF SCOPE: finance engine, onboarding, calendar, any adapter, any module screens beyond what search needs to open a record in a simple detail tile.

ACCEPTANCE:
- With sample data loaded, typing "receipt" shows an invoice, "receipts over $100 in October" filters correctly against fixtures with deterministic dates, and "unread from Maria" works.
- Search over 50,000 generated records returns under 50 ms in a benchmark test, and the benchmark result is in the report.
- Undo and redo work for create, edit, and delete of a Note and a Transaction in e2e.
- A corrupted or tampered encrypted field is detected and surfaced as a calm error, not a crash.
- The index is verified in a test to not exist in IndexedDB or localStorage.
```

---

## Phase 2: Onboarding

```
BRANCH: phase-2-onboarding

GOAL: The complete three-phase first-boot experience, producing a validated profile that later modules read.

REQUIREMENTS: ONB-01 through ONB-04, ONB-I-01 through ONB-I-07, ONB-II-01 through ONB-II-06, ONB-III-01 through ONB-III-04.

BUILD:
- Profile domain types and Zod schemas: PayConfig, IncomeStream, WorkingWeek, MobilityProfile, DietaryProfile, FeedSource, ActivityPreferences, PetProfile, plus a SkippedQuestions list.
- A pure function in domain/finance that generates a baseline projection from PayConfig, income streams, and savings for a given horizon and Clock. Support weekly, bi-weekly, semi-monthly (1st and 15th default, configurable), monthly, and irregular (band between conservative and typical). Include detection of months with three paychecks for bi-weekly. This is a core engine: exhaustive unit tests, including month ends, leap years, daylight saving boundaries, and a property test that total income over a horizon equals the sum of deposits.
- Onboarding flow: one question per screen, thin progress line, inline validation, skip on every question, back navigation, keyboard operation. Gentle inline prompt for implausible income.
- Phase I screen with a split-screen live preview of the baseline curve (SVG), animated about 250 ms with reduced-motion fallback. Currency input with locale formatting and shorthand such as 4.5k.
- Phase II screens: day grid with per-day hour painting, toggle cards with icons (inline SVG, no icon library unless approved in DECISIONS.md), walking-distance slider with approximate walking time, locale-aware miles or kilometers.
- Phase III screens: dietary tag chips, publication tag cloud with a search and add field resolved through a FeedResolver adapter (Mock plus Manual), outdoor activity chips, pet toggle with expanding fields.
- Settings screen section to edit every onboarding answer later. Edits propagate: changing pay frequency re-renders the projection.
- Skipped questions are stored and exposed through a repository method for the Sunday Reset to use later.
- Temporary overrides for working week and mobility (ONB-II-06) stored separately from the permanent profile.

OUT OF SCOPE: cart, actuals, dragging, scenarios, the briefing, adapters beyond FeedResolver.

ACCEPTANCE:
- E2E: complete the whole onboarding in under five minutes of scripted interaction, then reopen settings and edit pay frequency and see the preview change.
- Unit tests cover the example "4,500 bi-weekly" producing 26 deposits in 12 months and flagging three-paycheck months, as an example case only, with no hard-coded constants in production code.
- Skipping every question still produces a valid empty profile and a checklist of skipped items.
- Pet module absent from the DOM entirely when the toggle is off.
```

---

## Phase 3: Financial simulator and Subscription Sentinel

```
BRANCH: phase-3-finance

GOAL: The 3-line simulator with a draggable cart, scenarios, and the Subscription Sentinel.

REQUIREMENTS: FIN-01 through FIN-13, plus the Financial Velocity Strip component (reused by the briefing later).

BUILD:
- Domain: Wishlist and Cart item types (cost in cents, scheduled date, status), Scenario, Subscription (kind trial or recurring, nextChargeDate, trialEndsAt, amountCents, cadence, billingUrl). Pure functions for: the cart line, the actual line from transactions, projected balance on any date, the earliest safe date for an item, the nearest safe date to a requested date, and shaded near-zero zones. Property tests: adding then removing an item restores the original line, moving an item never changes total spend, and affordability is monotonic in cost.
- SVG chart component with the three lines, today marker, zero line, legend, shaded warning zone, and tooltip under the pointer showing projected balance for the date.
- Dragging: pointer events with continuous recalculation within one animation frame. When dropped on a shortfall date, settle to the nearest safe date, explain why, and offer an override. Provide keyboard (select an item, arrow keys to move by day or by pay period) and touch alternatives. Wishlist to cart drag or button.
- Scenarios as layers that never write to real cart records, with create, rename, switch, and delete.
- Sentinel tile: recurring list sorted by next charge date with annualized and monthly cost, a separate trials section with a countdown that shifts from neutral to urgent, outbound billing link (opens in a new tab with rel noopener), one-tap calendar reminder (creates an event record only, calendar UI comes later), and a high-priority banner for trials ending within 48 hours or bills due today. There is no cancel function anywhere in code.
- Financial Velocity Strip: mini chart and a plain-language sentence ("ahead of baseline by ...").

OUT OF SCOPE: survey, receipts, the command terminal, the calendar view.

ACCEPTANCE:
- Unit and e2e tests reproduce the example: a $300 item that stays above zero on one date and crosses zero three days earlier, with the explanation naming the next paycheck date.
- Dragging a marker across a 24-month horizon stays within the frame budget in a benchmark test.
- Every drag is undoable.
- A grep test fails the build if the string "cancelSubscription" or any network call to a billing host appears in the source.
```

---

## Phase 4: Post-purchase survey and receipt parsing

```
BRANCH: phase-4-survey-receipts

GOAL: Reconcile plans with reality through the mandatory survey and the receipt drop zone, and export reports.

REQUIREMENTS: SUR-01 through SUR-07, RCP-01 through RCP-08.

BUILD:
- Survey trigger: on app open and at midnight rollover, find cart items whose scheduled date is today or earlier with no survey. Open the modal. It must not close by Escape, outside click, or a close button. Focus trap, labelled controls, full keyboard operation.
- Survey answers and effects: Bought (cost pre-filled, writes a Transaction), Postponed (requires a new date, moves the cart marker), Canceled (removes the dip, records the savings as a note on the chart). Regret rating 1 to 5 and tags Essential, Joyful, Impulsive, Regretted, stored on the purchase record.
- Receipt pipeline behind a ReceiptParser interface: PDF text extraction through pdfjs-dist (lazy loaded), heuristic extraction of vendor, date, line items, tax, total, a confidence score, and matching to pending purchases or transactions. Screenshots go through an optional OcrAdapter that is off by default and lazy loaded.
- Drop zone UI accepting multiple files, processing in a Web Worker so the UI never blocks. Confidence at or above the named constant applies silently. Below it, show a confirmation card with editable fields.
- Per-vendor correction memory stored locally and applied to later parses, with tests proving the second parse of the same vendor uses the correction.
- Reports: CSV (hand-written, correct quoting and formula-injection protection by prefixing cells that start with = + - @) and XLSX through one small library behind an interface. Columns exactly as in RCP-06. Date range and tag filters. Regret and emotion tags excluded unless the user opts in.
- Receipt files are stored encrypted. Size and type are validated. Files are never opened as HTML or executed.

OUT OF SCOPE: bank connections, auto email ingestion, the Sunday Reset screens.

ACCEPTANCE:
- A fixture receipt PDF parses to the expected vendor, date, total, and tax and updates the actual line.
- A test proves the survey cannot be dismissed without saving.
- Exported CSV from a fixture with a malicious cell value is safe in a test.
- E2E: drop two fixture receipts at once, one high confidence and one low, and see one silent apply and one confirmation card.
```

---

## Phase 5: Natural language terminal and morphing calendar

```
BRANCH: phase-5-terminal-calendar

GOAL: Fast capture through the command bar and a calendar that changes shape with the zoom level.

REQUIREMENTS: TERM-01 through TERM-05, CAL-01 through CAL-07.

BUILD:
- Command parser in engine/commands using chrono-node with a custom refiner that uses the working-week configuration. Intents: purchase, reminder or event, task, note. Output is a typed result with intent, fields, confidence, and either a preview or exactly one clarifying question. No network, no model calls.
- The verbatim test sentences from REQUIREMENTS.md under TERM, plus adversarial cases: ambiguous "next Thursday", missing amount, "$150" without a date, past dates, locale date formats, and empty input.
- Command bar UI on Cmd/Ctrl+J: floating overlay, preview chips of what was understood, Enter confirms, Escape cancels, up arrow recalls recent commands, closes after success, undo toast.
- CalendarEvent domain type and repository. Calendar with three zoom bands: 30 minute or hourly, 3 to 12 hour pacing, and day or working week. Zoom with pinch, Cmd/Ctrl plus scroll, and number keys, with orientation-preserving transitions and reduced-motion fallback.
- Protected core hours: attempts to place personal items inside them require confirmation.
- Non-working days drawn quieter. Unassigned working time indicator in the hourly view. Task cards can be dragged into slots with a keyboard alternative.
- Travel time bars between events when a route is available through the existing RouteProvider interface. Define the interface and a Mock now. The real router comes in Phase 8.
- Wire "buy keyboard $150 on 11/20" into the cart and chart from Phase 3.

OUT OF SCOPE: AI task decomposition, inbox, real routing.

ACCEPTANCE:
- Each required sentence produces the expected record and the calendar shifts to the correct week where applicable.
- An ambiguous sentence yields one question, never two.
- Zoom changes preserve the focused date in a test.
- Every drag has a working keyboard path in e2e.
```

---

## Phase 6: Tri-fold inbox

```
BRANCH: phase-6-inbox

GOAL: Automatic sorting of messages into Work, Personal, and Promotional with learning corrections.

REQUIREMENTS: INB-01 through INB-06.

BUILD:
- MessageSource adapter interface with Mock and Manual implementations plus a plain-file import (.eml and .txt) with strict size caps and sanitization. No real mail or chat connections.
- Rule-based classifier in engine: signals include sender domain, list-unsubscribe markers, keywords, known contacts from the CRM stub, and deadline phrases. A local sender-to-stream correction map learned from user fixes. Prove the rule "moved twice from Promo to Personal stays in Personal" with a test.
- UI: segmented pills with unread counts, keys 1, 2, 3 to switch, a single-gesture correction control, collapsed single-count mode for deep work (the mode itself arrives in Phase 11, build the collapsed presentation now).
- Work items with deadlines create linked task cards with countdowns, using the Task type.
- Promotional stream: 1-click save to a research vault record, bulk archive, and no alert behavior.
- Personal stream: highlight contacts out of touch, using a Contact stub that Phase 10 will complete.
- Message bodies are rendered as plain text or sanitized. Never render raw HTML from a message. Add a test with a script payload.

OUT OF SCOPE: the CRM module itself, any live integration.

ACCEPTANCE:
- A fixture set of 60 messages sorts with a documented accuracy in the report, and every misclassification is listed.
- Corrections persist across reload.
- The script payload test passes and nothing executes.
```

---

## Phase 7: Tasks and the AI task decomposer

```
BRANCH: phase-7-tasks-ai

GOAL: Task cards as workspaces and the Small Steps flow, without ever requiring an AI connection.

REQUIREMENTS: TASK-01 through TASK-09.

BUILD:
- Complete the Task domain: role templates (student, professional), resources with URLs and titles, rubric text, conversation links, notes, deadline, micro-tasks, and progress rollup.
- Card UI with collapsible drawers (Resources, Rubric or Requirements, Conversation, Notes), collapsed state showing title, countdown, and progress, last-used drawer reopening first.
- Deadline countdown that accounts for remaining available working hours using the working week and existing calendar events. Urgency indicator moves calm to amber to strong red. Pure function with tests.
- AiProvider interface in adapters/ai with: a Mock provider that returns a deterministic plan, a Manual provider that only produces the copyable prompt, and a clean place to add a real provider later. Do not implement or bundle any real provider or key in this phase.
- Prompt builder that assembles a prompt from rubric, notes, links, deadline, and the user's availability. Copy-to-clipboard works with no provider connected.
- Small Steps flow: show exactly what will be sent before sending, call the provider, validate the response with Zod, show the proposed plan for editing, reordering, or rejection, schedule only on confirmation using the Phase 5 calendar and the working week, with buffers and no overlaps with existing events.
- A plain summary of what was sent is shown after each request and stored with the plan.

OUT OF SCOPE: any real AI provider, any live Slack or repository integration.

ACCEPTANCE:
- With the Mock provider, a history essay card produces a 4 day plan fitted around fixture events, with no overlaps, in a test.
- Disconnecting the provider leaves every other task feature working in e2e.
- A response that fails Zod validation shows a calm error and changes nothing.
- A test proves nothing but the selected card's content appears in the outbound payload.
```

---

## Phase 8: Recipes, grocery sync, transit router, local discovery

```
BRANCH: phase-8-food-transit

GOAL: Recipes to grocery list to route, with hard dietary and walking rules.

REQUIREMENTS: FOOD-01 through FOOD-06, TRN-01 through TRN-06.

BUILD:
- Recipe domain with ingredient parsing, a unit conversion table (metric and US), scaling with practical rounding to package sizes, and ingredient merging. Property tests for scaling round trips and merge commutativity.
- Dietary filter in domain with an ingredient to restriction table (for example nut allergy covers common tree nuts and peanuts, gluten-free covers wheat, barley, rye and derivatives). Adversarial tests per restriction, including hidden ingredients and synonyms. Apply the unverified-label rule from AGENTS.md section 9 item 11 and flag it in the report for human review.
- Pantry list, grocery list grouped by store section, one-click "Add to Grocery List", and an optional link to a planned shopping trip event.
- Recipe import from pasted text and manual entry in full. Link import goes through a RecipeImporter adapter with Mock and Manual only.
- Routing in domain: given a mobility profile, active modes, walking limit, a destination, a departure time, forecast data, and the next calendar event, return ranked options. Enforce: walking limit is a hard ceiling, excluded modes never appear, weather flags, earlier departure suggestion, never make the user late. Back it with Mock providers for maps and weather behind interfaces, and a deterministic fixture graph for tests.
- Local Discovery Engine: given a free calendar block, dietary filters, and reach, suggest places from a PlaceProvider adapter (Mock plus Manual). Filter by dietary needs and by reachability.
- Split view UI: recipe or venue on the left, route options with time bars on the right. Replace the Phase 5 mock RouteProvider with this router, keeping the same interface.

OUT OF SCOPE: live maps, live weather, live place data, the hikes planner.

ACCEPTANCE:
- With a 1.5 mile limit, a venue requiring a 2.1 mile walk is never offered as primary, in a test with the fixture graph.
- A rain forecast produces a weather flag and an earlier departure suggestion in a test.
- A recipe containing a conflicting ingredient is absent from the list for a user with that restriction, and present for a user without it.
- Calendar travel bars from Phase 5 now come from the real router.
```

---

## Phase 9: Hikes and activity planner

```
BRANCH: phase-9-outdoors

GOAL: Turn free calendar time into outings that fit the person, the transit, and the weather.

REQUIREMENTS: OUT-01 through OUT-09.

BUILD:
- Domain: Trail (distance, elevation gain, elevation profile points, difficulty, loop flag, dog-friendly flag, trailhead coordinates, activity type), Outing, ActivityLogEntry. Activity types: Hike, Bike ride, Run, Paddle, Climb, Park day.
- Ranking function in domain: inputs are the profile (mobility, activity picks, tolerance), a free block, the forecast, daylight window, and travel time from the Phase 8 router. Output is a ranked list with a match score and the reasons. Hard rules: never suggest an outing that cannot be finished before sunset with a margin, never exceed the walking limit to the trailhead as a primary option, and car-free users see transit-reachable trailheads first. Unit tests for each rule and for tie-breaking.
- TrailProvider adapter with a clearly labeled sample set, and a manual trail entry form. No live trail data.
- Hike card UI: stat tiles, elevation profile as SVG, hourly weather window with the best window highlighted, sunset and back-by time.
- Dog-friendly filter present only when Pet Tracker is on, verified by test.
- Auto-plan on selection: calendar block, route, gear checklist. Gear items can be added to the cart so the Phase 3 chart shows affordability.
- Share plan: generate a copyable message for a trusted contact. No automatic sending. The CRM contact picker uses the Contact stub for now.
- Activity log with miles, elevation gain, and outings, plus a weekly miles chart.

OUT OF SCOPE: live trail data, social features, GPS tracking, any automatic sharing.

ACCEPTANCE:
- With a free Saturday morning fixture, the planner returns the expected ranked trails, warns about afternoon heat, creates the calendar block, and adds the checklist, in e2e.
- A trail that would end after sunset is excluded in a test.
- Pet Tracker off hides the dog-friendly filter. Pet Tracker on shows it.
```

---

## Phase 10: Pet tracker, CRM, screen time, Sunday Reset

```
BRANCH: phase-10-life-reset

GOAL: The maintenance modules and the guided weekly review that ties everything together.

REQUIREMENTS: PET-01, CRM-01, SCR-01, RST-01 through RST-06.

BUILD:
- Pet Tracker: vet events, vaccinations, food restock with a link to the grocery list, reminders generated from species and birthdate through a plain rules table. Absent from the UI when disabled.
- Relationship CRM: contacts, contact logs, gift idea pad, preferred rhythm per person, nudges, gift ideas resurfacing before birthdays and holidays. Replace the Contact stubs from Phases 6 and 9 without changing their interfaces.
- Screen time: CSV import and manual entry only. Correlation against impulsive-tagged purchases from Phase 4 presented as plain observations, with minimum-sample thresholds so that no pattern is claimed from too little data, and no judgmental wording.
- Sunday Reset wizard: configurable day, a step per screen, progress indicator, completion summary, skippable steps, move to another day. Step 1 inbox triage (bulk archive promo, flag only messages that seem to need a reply). Step 2 financial audit (projected vs actual, low-confidence receipt matches, pending surveys). Step 3 schedule alignment (draft arrangement of prioritized tasks, with a weekend outing from Phase 9 droppable in). Also surface skipped onboarding questions, pet vaccination dates, and the weekly activity summary. Monthly export summary appears if scheduled.

OUT OF SCOPE: OS-level screen time sync, any automatic messaging to contacts.

ACCEPTANCE:
- E2E walks the whole ritual and finishes with a summary.
- Skipped onboarding questions appear in the first Reset and not afterwards once answered.
- Correlation shows nothing, with a neutral message, when data is below the threshold.
- No code path sends a message to a contact automatically.
```

---

## Phase 11: Morning briefing and progressive disclosure engine

```
BRANCH: phase-11-briefing

GOAL: The landing screen and the context engine that decides what the canvas shows.

REQUIREMENTS: BRF-01 through BRF-08, UX-02, UX-06.

BUILD:
- Tile selector in engine/tiles: a pure function from a context (time of day, weekday or weekend, deep-work state, urgency signals such as trials under 48 hours or bills due, days away, user overrides) to a layout with sizes and order. Pinned tiles never shrink or hide. Every automatic change in size or visibility is recorded and shown to the user in a calm notice. Exhaustive unit tests with a decision table.
- Deep-work mode: a user-declared state tied to a calendar block that suppresses promotional feeds, collapses the inbox to a count, and dims unrelated tiles.
- The briefing itself: asymmetric grid with the most urgent item in the wide tile, Financial Velocity Strip, Sentinel banner, Tri-Fold summary with Promo muted, top 3 unread news cards with reading time ranked by recency and the user's own history (never engagement), a micro-schedule of the next three items with travel time, expand in place, pin, resize, hide.
- NewsSource adapter with Mock and Manual (paste a link, or import a plain RSS file). Mute, pause for a week, and remove in one tap.
- Weekend variant and a catch-up variant after several days away.

OUT OF SCOPE: live news fetching.

ACCEPTANCE:
- A decision-table test covers at least 20 contexts, including a trial ending in 31 hours promoting the Sentinel to the primary tile.
- Pinned tiles survive every context in a property test.
- A skipped-tile shrink always produces a visible notice, verified in e2e.
- Briefing is reviewable in about 30 seconds: measure the number of distinct primary elements and keep it to the number listed in BRF-02.
```

---

## Phase 12: Hardening

```
BRANCH: phase-12-hardening

GOAL: Prove the whole thing works together, without adding features.

BUILD:
- Full accessibility pass against WCAG 2.2 AA: automated axe checks in e2e for every module and every modal, manual keyboard walkthrough notes for the survey, command bar, spotlight, drag alternatives, and the Sunday Reset. Fix issues found.
- Performance pass: confirm every budget in AGENTS.md section 6 with recorded numbers. Fix regressions.
- Security pass: dependency audit, CSP header and meta, confirmation that no outbound request occurs with every adapter in its default state (an e2e test that fails on any network request), input sanitization review for imports, and a review of the Vault threat-model note.
- Data safety: full export then wipe then import round trip test, migration test from every earlier schema version, and an automatic snapshot before migration verified.
- End to end journey tests: first boot through onboarding, a purchase through the survey and receipt, a command-bar capture, a task through Small Steps with the Mock provider, a recipe to a route, a hike to the calendar, and a full Sunday Reset.
- Remove dead code and unused dependencies. Update README with setup, scripts, architecture, and the adapter list.
- Reconcile docs/PROGRESS.md: every requirement ID mapped to tests, every Deferred item reviewed.

OUT OF SCOPE: new features of any kind.

ACCEPTANCE:
- All gates pass. The report lists every requirement ID with its test and any not covered.
- Zero outbound network requests in the default configuration, enforced by test.
```

---

## Audit prompt (read only, use after any phase)

```
Do not modify any file except docs/AUDIT.md. Check out the branch phase-<N>-<slug>.

Audit this branch against AGENTS.md and docs/REQUIREMENTS.md for Phase <N>:
1. Run typecheck, lint, test, build, and e2e. Record exact results.
2. For every requirement ID the phase claims, find the test that proves it. List any claimed ID with no test or with a test that does not really check the requirement.
3. List every file changed outside the phase scope.
4. List every new dependency and whether it is in docs/DECISIONS.md.
5. Search for: any, @ts-ignore, eslint-disable, skipped or only'd tests, TODO or FIXME, hard-coded colors or pixel values in components, floats used for money, direct database writes from components, outbound network calls, and em or en dashes in user-facing text.
6. Compare the diff with earlier phases and list any change to a published contract.
7. Give a verdict: PASS, PASS WITH NOTES, or FAIL, with a numbered list of exact defects.

Do not fix anything. Be strict and specific.
```

---

## Targeted fix prompt (use after an audit)

```
Check out branch phase-<N>-<slug>. Read AGENTS.md and docs/AUDIT.md.

Fix only the defects numbered <list> in docs/AUDIT.md. Do not change anything else. Do not refactor. Do not add features. For each defect, add or repair the test that proves the fix first, watch it fail, then fix the code, then watch it pass.

When finished, re-run typecheck, lint, test, build, and e2e, update docs/PROGRESS.md, and report in the AGENTS.md format with a section listing each defect number and the commit that fixed it.
```

---

## Recovery prompt (when a run has gone off track)

```
Stop. Do not make further changes yet.

Run `git status` and `git log --oneline -20` on the current branch. Then write docs/RECOVERY.md listing:
1. Every file that was changed in this run and whether it was in the phase scope.
2. Every commit in this run and whether it passes typecheck and tests on its own.
3. The last commit at which all quality gates passed.
4. What you would revert to restore that state, as exact git commands that do not rewrite shared history (for example `git revert`, or creating a new branch from the last good commit).

Do not run any of those commands. Wait for the human to choose.
```
