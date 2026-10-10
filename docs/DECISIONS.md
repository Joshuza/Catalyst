# Decisions

Append-only log. Date uses the client calendar, America/Los_Angeles.

## 2026-10-09: Phase 0 scope

The user explicitly selected: "Start Phase 0 and retain the animations for later phases." Build only the foundation. Purchases, finance, tickets, task groups, deletion, and uploads do not run in this phase. No database or adapters are added. The original AGENTS.md and specifications are copied unchanged. The supplied visual PDF is absent from the ZIP; the Markdown requirements remain authoritative.

## 2026-10-09: Dependency choices

Exact versions are pinned and pnpm-lock.yaml is tracked. React 18 is intentionally retained as specified. Other module-specific dependencies are deferred until their phases rather than installed without use. Measured sizes below are each direct package's unpacked files, excluding transitive packages, and are not production bundle sizes. Development dependencies add zero browser bundle bytes. The production build is measured in PROGRESS.md.

| Package                   | Version | Purpose                                                                                   | License    | Direct installed size | Why not a smaller option                                                   |
| ------------------------- | ------- | ----------------------------------------------------------------------------------------- | ---------- | --------------------- | -------------------------------------------------------------------------- |
| react                     | 18.3.1  | Component runtime required by the specified stack. (runtime)                              | MIT        | 311 KiB               | A handwritten DOM layer would replace the requested React stack.           |
| react-dom                 | 18.3.1  | Mount and update React in the browser. (runtime)                                          | MIT        | 4408 KiB              | Required renderer for React; no UI kit added.                              |
| @eslint/js                | 9.39.1  | ESLint recommended JavaScript rules. (development only)                                   | MIT        | 15 KiB                | Official rules avoid a custom checker.                                     |
| @playwright/test          | 1.56.1  | Required browser flows with keyboard, offline, and viewport emulation. (development only) | Apache-2.0 | 25 KiB                | Unit tests cannot prove browser caching and responsive interaction.        |
| @testing-library/jest-dom | 6.9.1   | Readable assertions about accessibility and DOM state. (development only)                 | MIT        | 294 KiB               | Standard test matchers avoid duplicating assertion logic.                  |
| @testing-library/react    | 16.3.0  | Render and interact with React for the required unit tests. (development only)            | MIT        | 334 KiB               | Raw DOM mounting would repeat test infrastructure.                         |
| @types/node               | 24.10.1 | Types for test and build configuration. (development only)                                | MIT        | 2460 KiB              | Required for strict typed Node tooling.                                    |
| @types/react              | 18.3.27 | Strict React 18 component types. (development only)                                       | MIT        | 431 KiB               | The specified runtime requires its matching type definitions.              |
| @types/react-dom          | 18.3.7  | Strict React 18 renderer types. (development only)                                        | MIT        | 37 KiB                | The renderer requires matching type definitions.                           |
| @vitejs/plugin-react      | 5.1.1   | React compilation and development refresh. (development only)                             | MIT        | 44 KiB                | Official integration avoids custom transform code.                         |
| eslint                    | 9.39.1  | Required lint gate and local architecture rule. (development only)                        | MIT        | 2923 KiB              | A homemade linter would not replace the required gate.                     |
| eslint-plugin-react-hooks | 5.2.0   | Enforce hook lifecycle correctness. (development only)                                    | MIT        | 271 KiB               | Static hook validation is more reliable than manual review alone.          |
| globals                   | 16.5.0  | Known browser and Node names for ESLint. (development only)                               | MIT        | 194 KiB               | Maintained definitions avoid an incomplete handwritten global list.        |
| jsdom                     | 27.2.0  | DOM environment for Testing Library unit tests. (development only)                        | MIT        | 3211 KiB              | Required to run component tests without launching a browser for each unit. |
| prettier                  | 3.6.2   | Required deterministic formatting tooling. (development only)                             | MIT        | 8260 KiB              | A custom formatter would add unnecessary maintenance.                      |
| typescript                | 5.9.3   | Strict language compiler and typecheck gate. (development only)                           | Apache-2.0 | 23071 KiB             | Explicit requirement; JavaScript alone would not meet it.                  |
| typescript-eslint         | 8.46.4  | TypeScript-aware lint parser and rules. (development only)                                | MIT        | 30 KiB                | ESLint alone cannot parse the requested TypeScript stack.                  |
| vite                      | 7.2.2   | Required local development and static production build. (development only)                | MIT        | 2215 KiB              | Explicit stack choice; no server framework needed.                         |
| vitest                    | 3.2.4   | Required unit-test runner integrated with Vite. (development only)                        | MIT        | 1347 KiB              | Explicit stack choice; no second unit runner added.                        |

Only esbuild is allowed to run its dependency build script, because Vite requires the platform binary. pnpm supplies and verifies the pinned packages; no external scripts are downloaded into the app.

## 2026-10-09: Architecture and foundation conventions

- Implement the layer rule locally in ESLint rather than adding a boundary plugin. It checks imports, re-exports, and dynamic literal imports. Domain code also rejects React and browser persistence globals. No path aliases are configured; any future alias support must extend the rule and its tests.
- Use an injected Clock and entropy source for ULIDs. Same-timestamp and backwards-clock calls remain monotonic; invalid timestamps, short entropy, and entropy exhaustion fail explicitly. No data records need identifiers in Phase 0.
- Theme is the only saved setting and uses localStorage as explicitly allowed in Phase 0. Tile expansion and dimming are ephemeral sample-shell state. Database mutation commands and undo come in Phase 1.
- Colors, spacing, sizes, radii, type, and motion are centralized in tokens.css. Responsive breakpoints use 64rem and 40rem in the stylesheet because CSS custom properties do not work in ordinary media conditions. SVG path geometry is illustration data; it is not a CSS design value. Manifest and generated icon metadata repeat the brand colors because they cannot reference CSS.
- Displayed text is never dimmed through opacity, preserving text contrast. The dimmed tile uses a quieter surface and reduced decorative opacity. Focus targets are at least 36px, and the canvas is checked at 360px.
- Precache the production index, generated JS and CSS references, manifest, and icons on service-worker installation so offline reload works immediately after the first completed visit. Cache only same-origin GET requests. No external fonts, analytics, adapters, or CDNs are used.
- The system Chromium executable is used for browser verification through NEXUS_CHROMIUM_PATH. It is an environment selector, not a bundled browser or a repository dependency.
- The existing repository is /workspace/Catalyst; the branch starts from origin/main and leaves its two README files unchanged. No main commit, force push, or merge is performed.

## 2026-10-09: Retained user animation integrations

The following is the retained integration contract for the fragments in the user's request. The original pasted fragments remain in the conversation. They are not compiled, installed, or presented as implemented in Phase 0. They are user-requested additions to the project specification, not instructions that override the workflow independently.

| Fragment                          | Target phase                                                           | Integration and acceptance behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ReceiptPrinter compound component | 3 finance visuals, 4 purchase/receipt completion, 5 typed commands     | Preserve processing → printing → complete and stepped or smooth feed. Preserve the 20 printing transform keyframes and 1.75-second feed from the user snippet, with reduced-motion and animate=false instant changes. Commit validated data before showing completion. A planned or wanted purchase changes only the cart dotted line from its selected date; a bought purchase updates actuals using exact cents and the survey. Override order labels with plan labels for intention, so the UI does not imply payment processing. The UI records purchases; it does not buy products. |
| Ticket                            | 5 calendar; 8 transit reminders                                        | Use for event, flight, and train reminders. Preserve torn corners, notches, perforation, body/stub composition, and optional subtle tilt. Restrict tilt to fine-pointer hover and no reduced motion. Show date, time, place, and user-entered reference details. Label the item as a reminder; never manufacture a boarding pass, booking, or scannable ticket. No booking integration is added.                                                                                                                                                                                         |
| PlayingCard                       | 7 task groups; 9 selectable activity groups where relevant             | Preserve rank/suit corner indices, pip layouts, red/black suits, faceDown, 5:7 aspect ratio, and patterned back fallback. The pasted component renders a card but does not animate selection; add fan, flip, or selection motion in the consuming group. Keep real task/action titles and selection state available to keyboard and screen readers. Cards are a presentation for existing grouped actions, not a new game feature.                                                                                                                                                       |
| DynamicButton                     | Shared control introduced with first relevant later module             | Preserve content-width measurement, ResizeObserver, icon/state-key transitions, primary/secondary variants, and full width. Respect reduced motion, forward the ref, preserve focus while labels change, and announce status once. Use Phase 0 tokens and touch target sizing.                                                                                                                                                                                                                                                                                                           |
| HoldToConfirmButton               | 1 record deletion or first later module using deletion                 | Preserve 1600ms hold, progress overlay, pointer and Enter/Space input, early-release/move-out/blur cancellation, confirmed state, and 1800ms reset. Cancel timers on unmount or disable. Soft-delete through the command bus and offer undo. Never show success before the mutation succeeds. Include accessible instructions about holding Enter or Space.                                                                                                                                                                                                                              |
| MagneticDropZone                  | 4 receipts; other import phases through their own validated boundaries | Preserve 180px magnet range, 10px maximum offset, spring behavior, proximity glow, file icons, file picker, validation, replace/remove, and reduced-motion behavior. The receipt consumer overrides multiple=false to multiple=true and narrows accept to PDFs and screenshots. Use a named, documented size limit; no ZIP receipt processing merely because the generic snippet accepts ZIP. Selection means ready for local processing, not uploaded to a server.                                                                                                                      |

Compatibility work retained for the implementing phases:

- Port Tailwind utility classes to CSS modules and map grayscale, green, blue, and red names to centralized design tokens. No Tailwind dependency is added for these snippets.
- Replace @/helpers/classname-helper with a small local class combiner or ordinary class composition, consistent with the Vite project.
- Replace next/image with a browser img element or original SVG artwork. The project uses React/Vite, not Next.js. Court images, card-back PNG, receipt-paper.svg, and plastic-noise.svg are not included; provide local original artwork or the specified fallback without broken requests.
- The ReceiptPrinter export in the message ends without its closing object delimiter; repair syntax when introducing the component.
- Motion, Phosphor icons, and react-parallax-tilt are not Phase 0 dependencies. Before adding them, pin versions and document purpose, license, and measured bundle cost; inline icons or CSS tilt remain options where they preserve the requested behavior.
- Separate animation state from persisted financial state. Replay, reduced motion, rerendering, and timer completion must never duplicate transactions. Undo must recalculate the graph and restore records.
- A phrase such as “want to buy” without an amount or date yields one targeted clarification rather than inventing a price or booking.

## 2026-10-09: Hosting limitation

The Sites skill is available remotely, but its required filesystem helpers (project-setup.mjs, site-workflow.mjs, and set-project-id.mjs) are absent from this execution workspace and installed plugin roots. Do not create an orphan hosted Site or replace the prescribed credential workflow with custom publishing code. Complete and package the authorized Phase 0 repository locally; hosted publication remains unavailable in this environment.

## 2026-10-09: Readable component render functions

App and Tile exceed 60 lines after formatting because their accessible JSX markup is kept readable. They have minimal state and no domain logic; extracting their markup into otherwise empty components would obscure the single canvas and its three sample tiles. This is the documented function-length exception allowed by AGENTS.md. Every source file remains under 400 lines. The compact CSS module remains organized by selector and consumes centralized tokens.

## 2026-10-09: Output path availability

The projectless output path supplied by the chat configuration is absent and its /codex parent is read-only in the attached managed environment. Creating the exact output directory failed with `Read-only file system`, including with an additional permission profile for that path. The working source remains in the user's shared /workspace/Catalyst repository. Screenshots remain in /workspace/work/previews as verification artifacts. Do not report a downloadable attachment or an output link that was not successfully created.

## 2026-10-09: Theme transition contrast

Visual verification caught an intermediate theme frame where text changed immediately while tile backgrounds were still transitioning. Theme foreground and surface colors now change together without interpolating the background. Decorative shadow/opacity transitions still use the motion token. This keeps each light/dark text pair readable throughout switching.

## 2026-10-09: Ephemeral canvas store

Add zustand at exactly 4.5.7 (MIT) for ephemeral tile presentation, following the specified stack. It adds a small runtime selector/store layer; exact installed size and final production bundle size are recorded after installation. React component state remains appropriate for the local theme-storage hook. No Zustand persistence middleware or product records are used. A handwritten cross-tile store would duplicate the explicitly requested state library.

Zustand 4.5.7 measured direct installed size: 319 KiB, excluding transitive dependencies. Only its used browser store and selector code reaches the production bundle. It is MIT licensed.

## 2026-10-10: Phase 1 scope and dependencies

Continue with Phase 1 only, from the Phase 0 source already published on main. Use `phase-1-data-search`. The new ZIP is byte-identical to the standing specifications; the pasted animation contract is retained. No onboarding or finance engine is started.

| Package | Exact version | Purpose | License | Installed size, excluding transitives | Why hand-written code is insufficient |
| --- | --- | --- | --- | --- | --- |
| dexie | 4.2.1 | IndexedDB transactions and forward migrations | Apache-2.0 | 2961 KiB | Required stack; browser database transaction handling is not reimplemented. |
| zod | 4.1.12 | Strict schemas on persistence and backup boundaries | MIT | 3865 KiB | Required stack; comprehensive untrusted-input validation needs shared schemas. |
| minisearch | 7.2.0 | Local in-memory full-text search | MIT | 807 KiB | Required stack; avoids a custom inverted index. |
| fast-check | 4.3.0 | Seeded property tests of exact cent arithmetic | MIT | 1507 KiB | Development only; generated edge cases are stronger than enumerated happy paths. |
| fake-indexeddb | 6.2.4 | Database and migration tests using real Dexie transactions | Apache-2.0 | 330 KiB | Development only; browser storage cannot be replaced with a plain Map in contract tests. |

Sizes are package files, not bundled bytes. Production bundle cost is measured in the Phase 1 report. No motion or icon library is needed for the hold control: the supplied timing, progress fill, cancellation, and reduced-motion behavior are ported to React and token-based CSS.

## 2026-10-10: Storage, encryption and portable backups

Core records use strict discriminated Zod schemas, integer cents, calendar dates, UTC instants, ULIDs, and soft deletion. Transaction and message payload fields are individually AES-GCM encrypted with independent random IVs. Associated data binds each field to the record identity, version, timestamps, deletion state and sample provenance. Routing metadata (kind, ID, timestamps, deletion status, sample label) is deliberately visible in IndexedDB; notes/tasks/recipes/settings are not sensitive collections under the Phase 1 specification.

The device key is a non-extractable CryptoKey stored in IndexedDB. This protects against a casual plaintext database-file inspection, not against malicious same-origin JavaScript, a compromised browser/profile, an unlocked device, or code that can use the stored key to decrypt. There is no password authentication or recovery service. Never generate a replacement key silently when encrypted records exist. Invalid ciphertext stays untouched and is excluded from search with a visible error.

A portable JSON export contains validated plaintext records so it can be restored on another device without exporting the non-extractable key. Explain this beside the export control. Exports include soft-deleted records and sample provenance; keys, search indexes, and internal migration metadata are not portable records. JSON input is capped at 20 MiB and 50,000 records, duplicate IDs and unknown schema keys are rejected, and import merges by ID in one undoable atomic command. Nothing is evaluated as code or inserted as HTML. Automatic migration snapshots remain on-device and retain ciphertext and the original key reference before transformations. Storage version 1 is the compatibility fixture; version 2 adds nullable sample provenance without destroying records.

## 2026-10-10: Commands, search and presentation scope

The engine depends on a domain RecordStore interface; the UI composes it with the data repository, preserving Phase 0 layer directions. The command bus serializes mutations, returns new state and inverse patches, and supports atomic multi-record undo/redo. Undo of creation makes a tombstone rather than physically deleting a record. Expected-state checks reject concurrent edits. Undo/redo history is session-only; record contents survive reload. Native text-field undo takes precedence while typing; app shortcuts apply outside editable controls.

Search indexes active notes, tasks, transactions, messages and recipes in memory only. Plain-language receipt/amount/month and unread/sender filters use deterministic rules. Costs compare absolute cents because logged expenses are negative; month without a year searches all years. Promotional matches remain searchable but rank below equivalent direct matches. New note/task actions and month-filtered JSON export are search verbs; the complete module screens remain in later phases. Sample loading is opt-in, uses a deterministic fixture set, and removal soft-deletes exactly the records carrying that sample-set ID. Every fixture title carries Sample.

The Phase 0 sample shell remains intact; Phase 1 adds a local-data toolbar, Spotlight, and a simple detail overlay. Existing design tokens and keyboard interaction remain. Hold-to-delete accepts pointer or held Enter/Space, cancels early release, blur, pointer movement outside the boundary, lost capture and disabled state, and awaits the command before announcing success. All user-data changes have undo. Theme and sample presentation controls are the explicit Phase 0 exceptions.

## 2026-10-10: Phase 1 verification and UI implementation details

Search chooses the least frequent indexed term as a MiniSearch candidate anchor, then checks the remaining prefix terms and deterministic filters. This avoids scoring every common term separately for selective multiword queries. The benchmark covers receipt, amount/month, sender/unread, and a selective text query across 50,000 deterministic records. The measured machine is the session VM; it does not certify all queries on every mid-range laptop. Finance drag budgets do not apply before the finance phase.

Native modal dialogs handle background modality. An explicit Tab/Shift+Tab wrap prevents focus moving to browser chrome, the main field is focused after showModal, and an opener or the search control regains focus on close. The dynamic button retains measured widths, incoming and outgoing content transitions, ref forwarding, icon/state keys, and full/content width; all transforms and fades become instant under reduced motion. Hold duration remains 1600 ms even under reduced motion, since it is the confirmation gesture, not a decorative transition.

React render functions in LocalWorkspace, RecordDetail, Spotlight, DynamicButton and HoldToConfirmButton exceed 60 lines because they include declarative accessible JSX and local lifecycle/event handling; splitting the markup would obscure focus and form relationships. Each file remains below 400 lines. Domain, command, and storage operations stay small. Integration tests that compose engine and data live under src/test, so the engine's runtime layer contract is preserved. The new test environment uses fake-indexeddb and Node WebCrypto instead of skipping storage and encryption checks. Currency editing and display use the configured settings locale or the browser locale, including localized digits; calculations continue to use exact integer cents.

The Modal render function, the deterministic sample-record fixture table, suite declarations, and sequential e2e callbacks also exceed 60 lines intentionally. Their markup, fixture definitions, and complete user journeys remain together for review; no runtime computation is hidden in a long procedural function.

Final Phase 1 bundle: JavaScript 362,246 bytes, gzip 115,679; CSS 20,359 bytes, gzip 4,306 (Python gzip level 9). The combined dependency and feature delta from Phase 0 is 208,269 JavaScript bytes, gzip 65,376. No runtime CDN requests are required. Portable backup recovery when a key is lost or a stored row cannot be verified is possible on a fresh browser profile/device; in-place automatic key or corrupted-row recovery is not provided.

## 2026-10-10: Conservative currency interpretation

An explicit dollar symbol in an amount search means USD in Phase 1. Restrict that comparison to USD records, instead of comparing an EUR, GBP or other currency's nominal cents with a dollar threshold. Amount filters without a symbol compare nominal amounts within each record's stored currency; no exchange rates or conversions are implied. This is a conservative default because the requirements do not specify multiple dollar currencies. It needs human review if the intended dollar currency is CAD, AUD or another dollar unit. A mixed USD/EUR regression test covers the distinction. No finance or currency-conversion feature is introduced.

The final currency-fix build measures JavaScript 362,338 bytes (115,700 gzip), CSS 20,359 bytes (4,306 gzip); JavaScript delta from Phase 0 is 208,361 bytes (65,397 gzip). Final verification: 72 unit tests and 10 browser flows pass, search benchmark queries 0.10 to 18.86 ms over 50,000 records, and empty-profile readiness 399.3 ms on this VM. Phase 1 log dates follow the current environment’s UTC calendar.
