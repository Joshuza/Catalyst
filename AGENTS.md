# AGENTS.md: Nexus OS

This file is the standing instruction set for every Codex run in this repository. Read it fully at the start of every run. It overrides any assumption you would otherwise make. The feature requirements live in `docs/REQUIREMENTS.md`. The per-run task is given in the prompt that starts each run.

---

## 1. What you are building

Nexus OS is a local-first personal productivity and finance application. It combines a 3-line financial simulator, a natural language command terminal, a morphing calendar, a tri-fold inbox, task cards with an AI task decomposer, recipes and grocery sync, a smart transit router, a hikes and activity planner, a pet tracker, a relationship CRM, screen time tracking, and a guided weekly review called the Sunday Reset.

The governing design principle is **Calm High-Leverage Command**: one tiled canvas, progressive disclosure, generous whitespace paired with dense data, and no sprawling tab architecture. If a decision is unclear, choose the option that is quieter, shows less by default, and is easier to undo.

The source of truth for behavior is `docs/REQUIREMENTS.md`. If this file and the requirements ever conflict, stop and report the conflict instead of choosing.

---

## 2. Non-negotiable operating rules

These rules exist so that a run can never damage earlier work. Treat every one as a hard constraint.

1. **One phase per run.** Each run names exactly one phase. Do that phase only. When its acceptance criteria pass, stop. Do not begin the next phase, do not "get ahead", and do not refactor unrelated code.
2. **Work on a branch.** Create `phase-<N>-<slug>` from the current default branch at the start of the run. Never commit directly to `main`. Never force push. Never rewrite history. Never delete a branch.
3. **Small, reviewable commits.** Commit after each coherent unit of work with an imperative message such as `finance: add baseline curve generator`. No commit may leave the repository failing typecheck or tests.
4. **Stay in scope.** Only create or edit files that the current phase needs. Do not reformat, rename, or reorganize files you did not need to touch. If you believe an earlier phase has a bug, write it in `PROGRESS.md` under "Found issues" and continue. Fix it only if the run prompt explicitly allows.
5. **Never break a published contract.** Public types, module interfaces, database schemas, and command grammars from earlier phases are contracts. Extend them additively. If a change would alter or remove something existing, stop and report, and describe the migration you would propose.
6. **No destructive commands.** Do not run `rm -rf` outside `node_modules`, `dist`, or `coverage`. Do not run `git reset --hard`, `git clean -fd`, `git push --force`, or anything that deletes user data or history. Do not modify `.git`.
7. **Do not modify the specification.** Files under `docs/` are read-only for you, except `docs/DECISIONS.md` and `docs/PROGRESS.md`, which you maintain.
8. **No silent dependency additions.** Every new dependency needs an entry in `docs/DECISIONS.md` with its purpose, size impact, license, and why a smaller option or hand-written code was not enough. Prefer the standard library and existing dependencies. Pin exact versions.
9. **Do not weaken checks to pass them.** Never delete, skip, or loosen a test, lint rule, or type check to get green. Never use `any`, `@ts-ignore`, or `eslint-disable` without a one-line comment explaining why and an entry in `PROGRESS.md`.
10. **No fake completeness.** Anything unfinished must throw a clearly named `NotImplementedError` and be listed under "Deferred" in `PROGRESS.md`. Never ship placeholder behavior that looks real. Never leave lorem ipsum or invented data in the UI unless it is in a file under `src/fixtures/` and visibly labeled "Sample".
11. **Do not invent features.** If something is not in `docs/REQUIREMENTS.md`, do not build it. If it seems necessary, record it under "Proposed additions" in `PROGRESS.md` and move on.
12. **Do not guess on ambiguity.** If the requirements are ambiguous and no default is listed in section 9 of this file, pick the most conservative reading, record it in `docs/DECISIONS.md`, and flag it in your final report so a human can confirm.
13. **No secrets, no telemetry, no surprise network calls.** Never commit keys or tokens. The app makes no outbound network request unless the user has explicitly configured an adapter that requires one. No analytics, no crash reporters, no fonts or scripts from a CDN.
14. **If the environment blocks you, stop.** If installs, network, or tooling fail and you cannot proceed with what is already available, stop and report exactly what failed. Do not work around it by vendoring unreviewed code or stubbing out the failing piece.
15. **Finish by reporting.** Every run ends with the report in section 10, written to `docs/PROGRESS.md` and repeated in your final message.

---

## 3. Default stack (edit this block before the first run if you want something different)

| Concern | Choice |
|---|---|
| Language | TypeScript, `strict: true`, `noUncheckedIndexedAccess: true` |
| Runtime target | Modern evergreen browsers, installable as a PWA, works offline |
| UI | React 18 with function components and hooks, built with Vite |
| UI state | Zustand for ephemeral UI state only |
| Persistence | IndexedDB through Dexie, the single source of truth for user data |
| Validation | Zod schemas at every boundary (storage reads, imports, adapters, command parser output) |
| Styling | Plain CSS with CSS custom properties and CSS modules. No UI kit |
| Charts | Hand-written SVG components. No charting library, because dragging needs full control |
| Search | MiniSearch, built in memory on load, never persisted in plaintext |
| Date parsing | `chrono-node` for natural language dates, `date-fns` for arithmetic |
| PDF text | `pdfjs-dist`, loaded lazily |
| Spreadsheet export | CSV by hand, XLSX through one small library behind an interface |
| Unit tests | Vitest and Testing Library |
| End to end | Playwright |
| Lint and format | ESLint, Prettier, `tsc --noEmit` |
| Package manager | pnpm, lockfile committed |

Native mobile and desktop wrappers are out of scope. The UI must be responsive down to 360 px wide and usable by touch, but the primary target is a desktop browser.

---

## 4. Architecture rules

### 4.1 Layers

```
src/
  domain/        Pure TypeScript. No React, no DOM, no IndexedDB. Types, pure functions, rules.
  data/          Dexie schema, repositories, migrations, encryption layer, import and export.
  adapters/      Interfaces plus mock implementations for anything external (AI, mail, chat, maps, weather, trails, bank, screen time).
  engine/        Cross-cutting engines built on domain: search index, command parser, tile selector, scheduler.
  ui/            React components, grouped by module. Reads from data via hooks. Never calls adapters directly.
  fixtures/      Clearly labeled sample data used only by tests and the explicit "Load sample data" action.
  test/          Shared test utilities and builders.
docs/
  REQUIREMENTS.md, DECISIONS.md, PROGRESS.md
```

Dependency direction is one way: `ui` can import `engine`, `data`, `domain`. `engine` can import `domain`. `data` can import `domain`. `adapters` can import `domain`. `domain` imports nothing from the other layers. An ESLint rule must enforce this from Phase 0 onward.

### 4.2 Data rules

- **Money is an integer number of cents.** Never a float. Format only at the UI edge using `Intl.NumberFormat` with the user's locale.
- **Dates:** store calendar dates as `YYYY-MM-DD` strings and instants as ISO 8601 UTC strings. Never mix them. All "what day is it" logic goes through one injectable `Clock` so tests are deterministic.
- **Identifiers** are ULIDs generated in one place.
- **Mutations go through commands.** Every user-visible mutation is a function that returns the new state plus an inverse patch, so undo is always possible. No component writes to the database directly.
- **Deletes are soft** with a `deletedAt` field until a purge action runs.
- **Every stored record has** `id`, `createdAt`, `updatedAt`, `schemaVersion`.
- **Migrations are forward-only, tested, and never destructive.** Before any migration runs, the data layer writes an automatic export snapshot.
- **Encryption at rest.** Sensitive collections (transactions, receipts, messages, contacts, health-adjacent pet records, screen time) are encrypted field-wise with AES-GCM through WebCrypto. The key is a non-extractable `CryptoKey` kept in IndexedDB. Hide this behind a `Vault` interface so a passphrase-derived key can be added later. Document honestly in `DECISIONS.md` what this does and does not protect against.
- **The search index lives in memory only.** It is rebuilt from decrypted records at startup and never written to disk.

### 4.3 Adapters

Anything that talks to the outside world is an interface in `src/adapters/<name>/types.ts` with at least two implementations: a deterministic `Mock` used by tests and the sample-data mode, and a `Manual` or `Disabled` implementation that is the default for real users. A real network-backed implementation is only written when a phase explicitly asks for it. Adapters return Zod-validated data and must be safe to call when offline. Treat every adapter response and every imported file as untrusted input: validate it, cap its size, and never execute or interpolate it as code or markup.

The AI task decomposer is an adapter (`AiProvider`). The app must never bundle a key. If the user connects a provider, the key is stored in the encrypted vault. Only the content of the single selected task card is ever sent, and after each request the UI shows a plain summary of exactly what was sent.

### 4.4 Engines worth singling out

- **Finance engine** (`domain/finance`): pure functions that generate the baseline curve from pay schedules, apply cart items, overlay actuals, and compute affordability. These are the heart of the product. They must have exhaustive unit tests and property-based tests.
- **Tile selector** (`engine/tiles`): a pure function from a context object (time of day, mode, urgency signals, user overrides) to a tile layout. This implements progressive disclosure. It must be fully unit tested, and it must never remove a tile the user pinned.
- **Command parser** (`engine/commands`): deterministic, rule-based, built on `chrono-node`. Returns a typed result with a confidence value or a single clarifying question. No network, no model calls.

---

## 5. UI and design rules

- One tiled canvas, no multi-page navigation. Modules open as expanded tiles or overlays and always return to the canvas.
- Design tokens only. All colors, spacing, radii, type sizes, and motion durations come from CSS custom properties defined in one file. No hard-coded hex values or pixel values in components.
- Provide light and dark themes from Phase 0. Respect `prefers-color-scheme` and `prefers-reduced-motion`. Animations are about 250 ms and become an instant change under reduced motion.
- Every drag interaction has a keyboard alternative and a touch alternative. Every modal traps focus and restores it on close.
- The post-purchase survey modal cannot be dismissed with Escape, an outside click, or a close button. It closes only when its required answers are saved. It must still be fully keyboard and screen reader operable.
- Accessibility target is WCAG 2.2 AA. Contrast is checked in tests for the token pairs used for text.
- Copy is direct and understated. No exclamation marks, no emoji in the interface, no cute error messages. Do not use em dashes or en dashes in any user-facing text.
- Empty states say what the module is for in one sentence and offer one action.

---

## 6. Quality gates

A phase is done only when all of these pass, and you have run them yourself in this run and pasted the real output summary into the report:

1. `pnpm typecheck` passes with zero errors.
2. `pnpm lint` passes with zero errors and zero new warnings.
3. `pnpm test` passes. Domain logic added in the phase has meaningful unit tests, including edge cases, not just the happy path.
4. `pnpm build` succeeds.
5. `pnpm e2e` passes. Each phase adds at least one Playwright flow that exercises its main user journey.
6. Every requirement ID the phase claims is mapped to at least one automated test in `docs/PROGRESS.md`.
7. The app starts from an empty database and from a database created by the previous phase's final state, with no errors in the console.
8. No file over 400 lines unless it is generated or a data table. No function over 60 lines without a reason.

Performance budgets, checked from Phase 1 onward: global search returns in under 50 ms for 50,000 indexed records on a mid-range laptop, finance recalculation during a drag completes within one animation frame for a 24-month horizon, and the initial interactive load stays under 2 seconds on a cold cache with an empty database.

---

## 7. Testing rules

- Tests are deterministic. Inject `Clock`, random seeds, and adapters.
- Write the test for a requirement from the requirement's wording, not from your implementation.
- Use the example sentences in `docs/REQUIREMENTS.md` verbatim as test cases where they exist.
- Dietary filtering, walking-distance limits, and the three-line affordability math are safety and trust critical. Test them adversarially.
- Never use real personal data in fixtures. Never use real brand logos or copyrighted text in fixtures.

---

## 8. Git and file hygiene

- `.gitignore` covers `node_modules`, `dist`, `coverage`, `playwright-report`, `.env*`, and OS files.
- Do not commit generated files, build output, or lockfile changes unrelated to the phase.
- Keep a `CHANGELOG.md` entry per phase, in plain language.
- Keep `docs/DECISIONS.md` as an append-only log: date, decision, reason, alternatives rejected.
- Keep `docs/PROGRESS.md` as the live status: completed phases, requirement-to-test map, Deferred, Found issues, Proposed additions, Open questions for the human.

---

## 9. Defaults for known ambiguities

Use these unless the human has changed them in `docs/DECISIONS.md`. Do not re-litigate them.

1. **Semi-monthly pay** defaults to the 1st and 15th, adjustable in settings. Weekends and holidays do not move deposit dates in v1.
2. **Irregular freelance income** is drawn as a band between a conservative and a typical estimate, using invoice size, payment delay, and low-month estimate from onboarding. The middle line is the typical estimate.
3. **Affordability** means the projected balance on every day from the purchase date onward is at or above zero. A user-set safety buffer defaults to zero.
4. **Post-purchase survey** is non-skippable. "Postponed" is a valid answer and requires a new date. No snooze, no "ask me later" is added beyond what the requirements list.
5. **Illustrative numbers** in the requirements (for example a $4,500 paycheck, a $300 lens, a 1.5 mile walking limit, a 45 second setup) are examples. They are not constants. Never hard-code them.
6. **Message sources** (mail, chat, repositories) are adapters. In v1 the shipped sources are the Mock adapter and manual entry plus a plain file import. The tri-fold classifier is rule-based, learns sender-to-stream corrections locally, and has no model dependency.
7. **Receipt parsing** extracts text with `pdfjs-dist` and applies heuristics. Screenshots go through an optional OCR adapter that is lazy loaded and off by default. If confidence is below the threshold, the user sees a confirmation card.
8. **Auto-apply confidence threshold** for receipts defaults to 0.9 and is a single named constant.
9. **Local discovery, transit, weather, and trail data** come from adapters. v1 ships Mock adapters with a small labeled sample dataset and a Manual adapter where the user types in places or trails. The hard rules (walking limit, mode exclusion, weather flags, next-event check) are implemented in `domain` and tested without any adapter.
10. **Screen time** is imported from a CSV or entered manually in v1. Native OS sync is deferred.
11. **Dietary restrictions are hard filters.** A recipe that conflicts is hidden entirely, never shown with a warning. If a recipe has no ingredient-level data for a selected restriction, it is shown with a neutral "Not verified for <restriction>" label rather than being treated as safe. Record this in `DECISIONS.md` for human review.
12. **Sunday Reset** day defaults to Sunday and is user-configurable. Steps can be skipped, and the ritual can be moved to another day.
13. **Undo toast** duration defaults to 5 seconds.
14. **Platform shortcuts:** use Cmd on macOS and Ctrl elsewhere for the two global shortcuts, search and command bar. Expose both in a visible shortcuts list.
15. **Sample data mode** is opt-in, clearly badged, and fully removable in one action.

---

## 10. Required report at the end of every run

Write this to `docs/PROGRESS.md` (replace the current run section) and paste it as your final message:

```
PHASE: <number and name>
BRANCH: <branch name>
COMMITS: <count and short list>

STATUS: <COMPLETE | INCOMPLETE | BLOCKED>

REQUIREMENTS COVERED: <ID list>
REQUIREMENTS NOT COVERED: <ID list and why>

CHECKS (actual results from this run):
  typecheck: <pass/fail>
  lint: <pass/fail, warning count>
  unit tests: <passed/failed/skipped counts>
  build: <pass/fail>
  e2e: <passed/failed counts>

REQUIREMENT TO TEST MAP: <ID -> test file and name>

FILES ADDED OR CHANGED OUTSIDE THE PHASE SCOPE: <none, or list and reason>
DEPENDENCIES ADDED: <none, or list>
DECISIONS MADE: <list, each also in DECISIONS.md>
DEFERRED: <list>
FOUND ISSUES IN EARLIER PHASES: <list, not fixed>
PROPOSED ADDITIONS: <list>
QUESTIONS FOR THE HUMAN: <list>

HOW TO VERIFY BY HAND: <5 to 10 concrete steps a person can follow>
```

Be exact and unflattering. If something does not work, say so. A report that says INCOMPLETE and is accurate is more valuable than a report that says COMPLETE and is wrong. Do not describe work as done unless you ran the check that proves it.
