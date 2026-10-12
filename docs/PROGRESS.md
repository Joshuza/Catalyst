# Implementation progress

## Current run

PHASE: 2, Catalyst scrolling survey, unified capture and quieter dashboard; user-authorized design continuation.

BRANCH: `phase-2-catalyst-scroll-journey`, based on published onboarding commit `2b20f3d`. Main is unchanged.

COMMITS: 2: `55f6be5` Catalyst scroll/capture implementation; `docs: publish Catalyst journey guide and final verification` (this report's commit).

STATUS: **COMPLETE for the requested Catalyst design update.** The broader connected-service product remains incomplete, as documented in the previous reports.

REQUIREMENTS COVERED: user's scroll/blueprint/construction animation, survey integration, Catalyst rename, Add new page and quieter dashboard. Related ONB-01/02/04, UX-02/03/05/07/08 and BRF progressive disclosure, urgency, pinning and deep work behavior are exercised. Existing finance, storage, search, receipts and life modules remain in the implementation.

REQUIREMENTS NOT COVERED: exact missing Pear WebGL/film choreography; live external services; full human usability/screen-reader audit. Earlier specification gaps remain in the previous reports. The new user-directed layout takes precedence over the original tiled-canvas requirement.

CHECKS (actual results from this run):

- typecheck: PASS, zero errors.
- lint: PASS, zero warnings/errors.
- unit tests: 151 passed, 0 failed/skipped, 23 files.
- build: PASS, production build run by Playwright.
- e2e: 29 passed, 0 failed, full production suite in 4.0 minutes. Targeted scrolling/scheduling regressions also passed 3/3 after fixes.
- Whitespace/format/file limits: PASS, source/test/CSS files at most 400 lines. Cold first interactive: 503.3ms; 50,000-record search: 0.10–13.60ms; 730-day/100-purchase finance: 0.89ms. These are VM measurements, not a hardware certification.

REQUIREMENT TO TEST MAP:

- Scroll animation, active question, Catalyst name, skipped-question persistence -> `e2e/catalyst.spec.ts`, native scrolling journey; `e2e/onboarding.spec.ts`, complete detailed survey.
- Add new persistence/receipt/calendar/search, quiet dashboard, pinned/urgent sections -> `e2e/catalyst.spec.ts`, unified capture journey; `src/engine/product/briefing.test.ts`, urgency/pinning/hidden/focus rules.
- Skipped questions and old prompts -> `src/ui/onboarding/resolve-skipped.test.ts`, untouched questions and resolution cases.
- Mobile/reduced motion/offline art/type -> Catalyst mobile journey and existing onboarding/foundation browser checks.
- Legacy data/backup compatibility, export rename, undo/tamper -> data-search/hold-actions browser checks and retained storage/backup/migration unit tests.
- Detailed settings and rapid skipping -> existing ONB product journey; task approval/scheduling -> fixed-clock INB/TASK product journey; deep-work/pinning -> existing BRF evolution journey.

FILES ADDED OR CHANGED OUTSIDE THE PHASE SCOPE: none. Branding touches visible messages, download filenames, installation metadata and the shell; legacy data identifiers are retained deliberately.

DEPENDENCIES ADDED: none. Package renamed to `catalyst`; the same frozen-lockfile dependencies were restored when pnpm required an installed-metadata refresh. Original art/fonts are reused; blueprint animation uses native SVG/CSS and scrolling.

DECISIONS MADE: native scrolling with one active form; preserve expanded section heights; respect user scrolling during async saves; keep untouched prompts for Reset; static finished art under reduced motion; real undoable module capture; three default briefing sections with optional disclosure/customization; never conceal urgent/catch-up/pinned content; retain legacy database/backup contracts during visible rebranding. All recorded in `docs/DECISIONS.md`.

DEFERRED: live account/provider integrations and full human accessibility/usability audit remain open. Animation is an original scroll-driven blueprint and layered illustration reveal; unavailable third-party films/scripts are not replicated.

FOUND ISSUES IN EARLIER PHASES: an older calendar browser assertion depended on the host day being Saturday. Its clock is now fixed to the original example date; no scheduling rule was changed.

PROPOSED ADDITIONS: none beyond the user's request.

QUESTIONS FOR THE HUMAN: none block running the implementation.

HOW TO VERIFY BY HAND:

1. Download the branch ZIP below, extract it, install Node 22.12+ and pnpm 11.19.0, then run `pnpm install --frozen-lockfile` and `pnpm dev` from the folder with `package.json`. Open the printed localhost URL.
2. Scroll through setup and watch the house outlines draw, then reveal the existing oasis/nectarine painting. Begin/Back/Answer controls also move/focus the current question.
3. Enter financial values and use Continue. Scroll ahead immediately during a save; the page should respect your new position. Review skipped questions, export JSON and complete the three-second Catalyst initialization.
4. Open Add new and save a purchase, task, event, note, research item or subscription. Check its destination page/search, the purchase receipt animation and Undo. Personal events inside working hours require explicit confirmation.
5. Visit Briefing: money, schedule and inbox are visible first. Expand the financial graph, More for today and Customize dashboard. Pin a section, return to the quiet view and reload; pinned/urgent sections should remain visible.
6. At 360px, check survey scrolling and capture forms; with reduced motion, artwork remains static. For offline use, build and preview once, allow service-worker installation, disconnect and reload. Existing records/backups should remain usable.

SOURCE DELIVERY: https://github.com/Joshuza/Catalyst/archive/refs/heads/phase-2-catalyst-scroll-journey.zip . Full source, lockfile, tests and run instructions are included. The projectless output folder is unavailable in this environment; delivery uses the repository archive.

---

## Previous startup art-direction run

PHASE: 2, startup survey and nectarine art direction, user-authorized continuation.

BRANCH: `phase-2-onboarding-art-direction`, based on published product branch `e6a4e58`. Main is unchanged.

COMMITS: 3: `f412622` bundle artwork/type; `7cc4876` startup survey/preferences; `docs: publish startup source guide and verification report` (this report's commit).

STATUS: **COMPLETE for this startup redesign.** The broader connected-service product remains incomplete as documented in the retained previous report below.

REQUIREMENTS COVERED: ONB-01, ONB-02, ONB-04; ONB-I-01 through ONB-I-05 and ONB-I-07; ONB-II-01, ONB-II-02, ONB-II-04; ONB-III-01, ONB-III-03, ONB-III-04. User additions: every-boot survey, four detailed chapters, overhead, persona, six calendar defaults, transit pass/cycle equipment/Light Rail, topics/digest time, pet intervals, original nectarine/oasis art, local archival type, supplied pear.no HTML adaptation, clean response JSON, three-second initialization with real financial/mask/rule computation.

REQUIREMENTS NOT COVERED: ONB-03 human under-five-minute timing is unmeasured; ONB-II-03 units are manually selectable rather than automatically inferred from locale; ONB-III-02 accepts source names/URLs and local feed imports, but automatic remote feed discovery is absent. ONB-I-06 has real live preview but uses the requested art-and-survey layout instead of a separate graph/input split. ONB-II-05 public filters use the newly requested native checkboxes with Tab/Space, rather than arrow navigation across every card. Other product-wide gaps remain in the previous report.

CHECKS (actual results from this run):

- typecheck: PASS, zero errors.
- lint: PASS, zero errors/warnings.
- unit tests: 148 passed, 0 failed, 0 skipped, 22 files.
- build: PASS, including the final production browser build.
- e2e: full suite 26 passed, 0 failed; after reference refinements, both affected onboarding journeys passed again (2/2).
- Exact intermediate artwork commit: typecheck passed; 139 unit tests passed, 0 failed/skipped.
- Whitespace/file limits: PASS; every source/test/CSS file is at most 400 lines.

REQUIREMENT TO TEST MAP:

- ONB-01/02/04, ONB-I, survey additions -> `e2e/onboarding.spec.ts`, detailed startup flow; `e2e/product.spec.ts`, ONB profile persistence flow; `src/domain/product/startup.test.ts`, validated JSON, due dates, masks, matrices and affordability.
- ONB-II/III, calendar/role/pet propagation -> `e2e/onboarding.spec.ts`, detailed startup flow; `e2e/product.spec.ts`, FOOD/TRN/OUT and PET/CRM/SCR/RST journeys; startup hard-walking and personalized-reading unit cases.
- Skipped-answer resolution -> `src/ui/onboarding/resolve-skipped.test.ts`, nested financial changes and newly selected defaults.
- Offline art/type, 360px, reduced motion, validation/focus -> `e2e/onboarding.spec.ts`, mobile/offline journey; survey text contrast -> `src/test/contrast.test.ts`, eight new pairs.
- Existing encryption/search/backup contracts -> retained storage, backup and migration unit/browser suites. Cold first interactive 408.1ms; 50,000-record search 0.07–10.82ms; 730-day/100-purchase finance 0.88ms. These are VM measurements; the intentional three-second startup transition is tested separately.

FILES ADDED OR CHANGED OUTSIDE THE PHASE SCOPE: none. Calendar, Tasks, Reading, Briefing, Pet and Preferences changes propagate survey answers. Runtime initialization and walking-rule corrections are necessary for the requested startup/hard-limit behavior.

DEPENDENCIES ADDED: none. Bundled original PNG plus two SIL OFL font files: 4,528,800 bytes, with licenses/provenance in `src/assets/README.md`.

DECISIONS MADE: continue the tested product branch; additive strict profile fields; actual spending remains verified; monthly estimates affect simulation; saved records survive every boot; use local source/topic ranking and user-entered pet care dates; native requested form controls; use original art/local fonts; adapt supplied HTML's chapters/framing/ornaments; preserve reduced motion and left sidebar pages. All recorded in `docs/DECISIONS.md`.

DEFERRED: Pear's linked CSS/JS/films were absent; the stylesheet URL returned 403, so exact canvas choreography and original font identification cannot be reproduced. Letterform Archive reported maintenance; fonts are identified open-license alternatives. Live banking/mail/AI/feed/transit/weather/screen-time integrations remain unconnected. Full human usability and screen-reader audit remain open.

FOUND ISSUES IN EARLIER PHASES: no unresolved new issue. The authorized walking-limit bypass was fixed with adversarial tests.

PROPOSED ADDITIONS: none beyond user requests.

QUESTIONS FOR THE HUMAN: none block running this build.

HOW TO VERIFY BY HAND:

1. Download the source ZIP below, extract it, install Node 22.12+ and pnpm 11.19.0. In the folder with `package.json`, run `pnpm install --frozen-lockfile`, then `pnpm dev`; open the printed localhost address.
2. Begin the survey. Enter `4.5k`, a deposit date, liquid savings, monthly overhead and a safety buffer. Confirm the live graph changes and overhead does not become an actual transaction.
3. Set a role, working shifts, calendar scale, walking opt-out/ceiling, Light Rail, diet, sources/topics, and optional pet intervals/next dates. Skip a question and inspect the review.
4. Export survey JSON, inspect its responses, then initialize. Confirm the exact three-second title and computed graph/working mask/rule counts before the sidebar pages appear.
5. Check Calendar's chosen scale, new Task role, Reading priorities, Pet care reminders, and Preferences editing. Existing records should remain. Reload: saved answers return; use Continue with saved answers.
6. Run `pnpm build` and `pnpm exec vite preview`; visit once and allow service-worker installation. Disconnect/reload, test the art and local fonts, then try 360px, keyboard controls, dark theme and reduced motion.

SOURCE DELIVERY: https://github.com/Joshuza/Catalyst/archive/refs/heads/phase-2-onboarding-art-direction.zip . Full source, pinned lockfile, tests and run instructions are included. Build output and installed dependencies are excluded. The requested projectless output folder is unavailable due to filesystem ownership; the repository archive is the usable delivery path.

---

## Previous product-wide run

PHASE: 2 Product-wide local implementation; user-authorized expanded scope covering planned phases 2–12 and the supplied Gemini additions.

BRANCH: `phase-2-complete-product`, continued from Phase 1 `a5c7f11`. Main remains unchanged.

COMMITS: 4 this run: `f9eae1e` core models/engines/adapters; `71e0e5f` connected pages/interactions; `7c7a5e9` documentation/setup/scope; final portable-source instructions commit. Exact final hash is available in git history.

STATUS: **INCOMPLETE for the entire future product vision.** The substantial local/manual implementation is runnable and passes its checks. Connected external accounts, automatic ingestion, and the specific gaps below are not complete. This report does not equate having a page with implementing every service described in the brainstorming conversation.

## Actual checks

| Check              | Final result                                                                   |
| ------------------ | ------------------------------------------------------------------------------ |
| `pnpm typecheck`   | PASS, zero errors                                                              |
| `pnpm lint`        | PASS, zero errors, zero warnings                                               |
| `pnpm test`        | 131 passed, 0 failed, 0 skipped; 20 files                                      |
| `pnpm build`       | PASS, also run by the production Playwright web server                         |
| `pnpm e2e`         | 24 passed, 0 failed; 1.4 minutes                                               |
| `git diff --check` | PASS                                                                           |
| File length        | Every source/test/CSS file under 400 lines; long-function reasons in DECISIONS |

Final measured search over 50,000 records: receipt 11.33 ms; receipts over $100 in October 8.36 ms; unread from Maria 21.91 ms; indexed item 49999 0.10 ms. Final 730-day/100-purchase finance recalculation: 0.89 ms, below one 16.7 ms frame. These are VM measurements, not a certification of all hardware. Seeded finance properties run 500 cases; existing money properties run 1,000. Cold empty browser readiness: 584.8 ms, below the unchanged two-second budget.

Main production JavaScript: 401,259 bytes / 128,808 gzip; CSS: 34,539 bytes / 6,651 gzip. Lazy PDF: 406,367 bytes / 118,258 gzip, worker 1,050,959 bytes / 288,790 gzip. Lazy XLSX: 132,987 bytes / 40,079 gzip. Lazy OCR bootstrap: 15,666 bytes / 6,682 gzip; shipped worker/WASM/English language/licenses: 9,901,125 bytes. Page chunks are independently lazy loaded; production precache installs them and the local OCR/PDF assets. An actual offline screenshot OCR browser test has no external-origin requests or page errors.

Fresh databases, prior Phase 0 preferences, retained Phase 1 records, encrypted/plaintext migration fixtures, backup restoration, tamper/missing-key handling, Sample removal, reduced motion, dark theme, 360 px touch navigation, and offline production pages pass automated checks. Manual visual inspection uses current light desktop Briefing, dark desktop Finance, and dark 360 px Outdoors. The application remains local/manual, not hosted as a connected service.

Initial failures were corrected rather than hidden: visual inspection caught desktop styles overriding mobile CSS; corrected import order and added real page/panel-width browser assertions. sandbox restrictions prevented server binding; approved execution outside the sandbox enabled normal preview/browser checks. A controlled OCR checkbox needed an optimistic local value during persistence. Billing assertions initially queried absent/duplicate balances and were corrected to target the cleared balance. A newly added research payload used null instead of the required empty image string and was corrected. No test thresholds, compiler strictness, lint rules or safety limits were weakened. Playwright prints environment NO_COLOR/FORCE_COLOR warnings; these are not page errors or lint warnings.

## Requirements covered and test map

Ranges below mean every ID in the stated range, except explicitly partial requirements in the next section. The listed tests exercise the local/manual implementation; no coverage claim implies live provider connectivity. UX-01 is superseded by the user's left-page request, not silently claimed satisfied.

| IDs / capability                                                                                 | Automated test and evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-02, UX-04, UX-06                                                                              | `e2e/evolution.spec.ts`, “BRF / UX-02: focus suppresses reading, collapses the inbox, keeps pinned sections, and saves its calendar block”; `engine/product/terminal.test.ts`, “covers 24 contexts and never hides pinned briefing sections”; global search/terminal browser flows                                                                                                                                                                                                                                                                                                                              |
| UX-03                                                                                            | `e2e/foundation.spec.ts`, responsive 360 px touch navigation; page layout is additionally visually inspected, not a quantified cognitive-load measurement                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| UX-05                                                                                            | `src/test/commands.test.ts`, undo/redo create/edit/soft-delete; `src/test/product-storage.test.ts`, atomic linked records; `e2e/evolution.spec.ts`, subscription history and undo; `e2e/data-search.spec.ts`, keyboard edit/hold-delete/undo/redo                                                                                                                                                                                                                                                                                                                                                               |
| UX-07                                                                                            | `src/data/storage.test.ts`, encryption/tamper/migrations; `src/test/product-storage.test.ts`, all new sensitive payloads; `e2e/foundation.spec.ts`, offline pages and no external requests; `e2e/ocr.spec.ts`, offline local OCR                                                                                                                                                                                                                                                                                                                                                                                |
| UX-08, keyboard portions of UX-09                                                                | `src/test/contrast.test.ts`, 32 text-token contrast cases; foundation navigation/theme/reduced-motion tests; Spotlight focus and hold cancellation tests; automated checks do not establish complete WCAG 2.2 AA certification                                                                                                                                                                                                                                                                                                                                                                                  |
| ONB-01, ONB-02, ONB-04; ONB-I-01 through ONB-I-07                                                | `e2e/product.spec.ts`, “ONB / UX override: complete profile, real live pay graph, persisted preferences and left pages”; `domain/product/product.test.ts`, exact 26 deposits/three-paycheck months, leap/month-end clamping, secondary/irregular band; `domain/money.test.ts`, locale/shorthand/cent arithmetic; reset browser flow and profile schemas                                                                                                                                                                                                                                                         |
| ONB-II-01 through ONB-II-06                                                                      | Same onboarding browser flow; `domain/product/regressions.test.ts`, “never silently schedules a personal errand in a split or night shift”; route hard-limit tests and `domain/product/evolution.test.ts`, available working hours and buffers. Miles/km are selectable; automatic locale unit selection is partial                                                                                                                                                                                                                                                                                             |
| ONB-III-01, ONB-III-03, ONB-III-04; local/manual portion ONB-III-02                              | Profile and conditional Pet browser flows; dietary and trail domain tests. Feed resolution is a name/URL manual adapter, not network feed discovery                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| SRCH-01 through SRCH-06                                                                          | Existing `engine/search.test.ts`, required receipt/sender sentences, all five original kinds, typed currency constraints, 50k benchmark; `e2e/data-search.spec.ts`, `e2e/spotlight-guide.spec.ts`, `e2e/hold-actions.spec.ts`; Gemini research/contact search browser flow                                                                                                                                                                                                                                                                                                                                      |
| INB-01 through INB-06                                                                            | `engine/product/classifier.test.ts`, 60-message fixture with >=90% classification and trusted/local correction priority; `engine/product/terminal.test.ts`, twice-corrected sender learning; `e2e/product.spec.ts`, “INB / TASK…” now saves a promotion into visual research and Notes, then verifies corrections after reload. Work deadline conversion/CRM countdowns are implemented; not every sender/calendar edge has a browser case                                                                                                                                                                      |
| FIN-01 through FIN-09                                                                            | `domain/product/product.test.ts`, required $4,500 and $300 examples, scenarios, seeded reversible cart math and performance; `regressions.test.ts`, anchored actual cost, mixed currencies, safety buffer; `evolution.test.ts`, future-only income and subscriptions; `billing.test.ts`, month-end paid history; `e2e/product.spec.ts`, “FIN / SUR / TERM…”                                                                                                                                                                                                                                                     |
| FIN-10 through FIN-13                                                                            | Briefing/focus browser flow; `evolution.test.ts`, exact 47/49-hour trial expiry; `billing.test.ts` and subscription history browser flow; annualized/subscription sentinel UI. Billing links are user-supplied, never canceled automatically                                                                                                                                                                                                                                                                                                                                                                    |
| SUR-01 through SUR-07                                                                            | `e2e/product.spec.ts`, “FIN / SUR / TERM…” checks required modal, Escape/outside blocking, postponement and bought final cash-flow update; command/storage inverse tests. Canceled branch is implemented but its dedicated browser verification remains partial                                                                                                                                                                                                                                                                                                                                                 |
| RCP-01, RCP-02, RCP-05, RCP-06, RCP-07                                                           | `e2e/product.spec.ts`, “RCP: background multi-file PDF parsing, low-confidence review and safe report downloads”; `e2e/ocr.spec.ts`, offline English screenshot OCR; `domain/product/receipts.test.ts`, vendor/date/tax/total/items and formula escaping; `adapters/ocr/local.test.ts`, disabled/invalid OCR boundaries; subscription expense CSV browser flow and planning rows domain tests; `src/test/receipt-reconciliation.test.ts`, “RCP-03 / RCP-04 / RCP-05…” verifies automatic same-currency matching, explicit zero tax, linked final cost, low-confidence review, and remembered vendor corrections |
| TERM-01 through TERM-05                                                                          | `engine/product/terminal.test.ts`, every five required sentences verbatim, targeted weekday clarification, bought/wanted intents and protected after-work timing; finance/survey/terminal browser journey; history/undo UI                                                                                                                                                                                                                                                                                                                                                                                      |
| CAL-01 through CAL-07                                                                            | Task approval and calendar browser flow, itinerary linked event browser flow, focus calendar block, weekly draft browser flow; `domain/product/product.test.ts` and `evolution.test.ts`, conflicts, split shifts, available hours and buffers; `regressions.test.ts`, protected personal-slot search                                                                                                                                                                                                                                                                                                            |
| TASK-01 through TASK-09, local/manual/Sample scope                                               | `domain/product/product.test.ts`, “shares only the selected card context, validates proposals and rejects invalid data”; working-hour planning tests; `e2e/product.spec.ts`, “INB / TASK…” checks nothing schedules before approval and approved blocks appear. Live AI account implementation remains deferred; Sample plan does not guarantee four distinct days                                                                                                                                                                                                                                              |
| FOOD-02 through FOOD-06; manual/text FOOD-01                                                     | `domain/product/product.test.ts`, ingredient conflict synonyms/unverified labels, normalized scaling, duplicate/pantry math; `regressions.test.ts`, pantry subtraction once, fractions/counts; `e2e/product.spec.ts`, “FOOD / TRN / OUT…” adds real missing groceries and filters over-limit walking                                                                                                                                                                                                                                                                                                            |
| TRN-01 through TRN-06, manual route scope                                                        | `domain/product/product.test.ts`, “never offers a 2.1-mile walk with a 1.5-mile ceiling, excludes car, and respects the next event” and rain/10-minute earlier departure; food/transit/outdoors browser flow; no live map calculation is implied                                                                                                                                                                                                                                                                                                                                                                |
| OUT-01 through OUT-09                                                                            | Same browser flow chooses an outing and adds gear to cart; domain reachable/daylight/pet/distance ranking tests; `regressions.test.ts`, hourly weather and dog heat; sample/manual trail adapters. Actual trusted-contact sharing is copy-only. User-entered elevation points are displayed; missing measurements stay absent                                                                                                                                                                                                                                                                                   |
| CRM-01, SCR-01; manual portion PET-01                                                            | `e2e/product.spec.ts`, “PET / CRM / SCR / RST…” persists contact check-in, pet food-to-grocery, screen entry and reset; `domain/product/receipts.test.ts` and `evolution.test.ts`, seven unique varied dates before spending/focus correlation; product-storage encrypted logs. Pet species/birthdate wellness prompts exist; automated clinical schedules do not                                                                                                                                                                                                                                               |
| RST-01 through RST-03, RST-05, RST-06; task-draft part RST-04                                    | Maintenance/reset browser flow; `e2e/evolution.spec.ts`, “RST-04: weekly alignment proposes and schedules a draft only after approval”; working-slot domain tests. Outings already planned for the week can be included in review, but moving an outing onto a different reset day is not implemented                                                                                                                                                                                                                                                                                                           |
| BRF-01 through BRF-04, BRF-06 through BRF-08                                                     | Focus/pin browser test; 24-context briefing section unit test; `evolution.test.ts`, recency/small reading-history boost and muted/paused exclusion; onboarding/default landing and offline tests. Several-day catch-up is implemented with stored previous visit; 30-second human review time is unmeasured                                                                                                                                                                                                                                                                                                     |
| Gemini research, goals, habits, health, audio, itineraries, tickets, subscription history, fines | Four Gemini browser flows plus focus/reset; `domain/product/evolution.test.ts` validates images/reservations/trip dates/streaks/ranking; `billing.test.ts` validates history/audit/variance; `terminal.test.ts` fine remains planned until paid; product-storage test encrypts research image, goal, health, itinerary                                                                                                                                                                                                                                                                                          |

## Requirements not fully covered / deferred

- **UX-01:** expressly replaced with sidebar pages by the user. Briefing alone has summary sections; modules are dedicated pages.
- **UX-09:** automated keyboard/focus/reduced-motion/mobile/contrast checks pass; full screen-reader and WCAG 2.2 AA audit remains open.
- **ONB-03:** setup is short/skippable, but typical-human under-five-minute timing is unmeasured. **ONB-II-03:** selectable miles/km exists; units are not automatically chosen from locale.
- **ONB-III-02:** publication names/URLs resolve locally and imported RSS/Atom works; automatic feed discovery/fetching is absent.
- **RCP:** automatic reconciliation and vendor tax corrections now have dedicated local integration coverage as well as browser review/OCR flows. OCR remains opt-in English only, heuristic, with no 98% accuracy promise. Vendor learning adjusts tax-rate defaults for unclear parses rather than training a general document model.
- **RCP-08:** optional scheduled monthly-summary export is not implemented; manual monthly export is available during Reset.
- **SUR-05:** postponement and canceled dip-removal code exist; cancellation's own e2e case remains outstanding. **SUR-07:** required-modal keyboard behavior is covered in existing focus checks, but a complete keyboard-only three-answer survey matrix remains outstanding. PDF survey snoozing is not added; Postponed with a new date is the accepted valid answer under the ZIP default.
- **FOOD-01:** paste/manual recipe parsing, scaling and source URLs work; autonomous extraction of a remote recipe URL is absent.
- **TASK-06:** Manual and explicitly labeled Sample providers work; encrypted real API credentials, provider OAuth and remote proposal requests are absent. **TASK-07:** fitting approved blocks is tested; the illustrative four-step essay is not forcibly distributed over exactly four days when earlier blocks are free.
- **PET-01:** user-entered schedules, food restock, weight/prescription records, and next-birthday species wellness prompts work. Automatically derived vaccination/refill intervals are not implemented; use vet-confirmed dates.
- **RST-04:** prioritized task draft, date/drag editing and approval work. Weekend outings already on Calendar can be included in review; Reset does not reschedule an outing via day drop.
- **BRF-05:** optional adaptive shrinking of consistently skipped tiles is absent. Manual pin/hide/detail is provided. **BRF-04:** resize means expanded/compact detail, not a free-form size handle. **BRF-01:** no measured typical-human 30-second claim.
- **Gemini beyond local v1:** bank/mail/chat/music service authentication, live maps/transit/weather/trail APIs, OS screen-time sync, cloud/multi-user accounts, live social-like personalization, automatic daily feed refresh, product-page pricing/metadata scraping, AI semantic/image tagging, richer block notes, automatic travel-confirmation ingestion/QR extraction, Jira/Linear issue sync, native biometrics and cross-device reminders are not built. Tickets are original-link reminders, not valid entry credentials. Work tickets can be entered as contextual tasks. Health reminders are manually configured. Habit streaks track check-ins, not automatically certified bank-budget streaks. No emergency records vault, per the user's removal.

These absent integrations have no pretend Connected buttons or synthetic real-user results. Default adapters are explicitly manual/disabled and Sample fixtures require a deliberate load. No payment processing or cancellation service exists.

## Files, decisions and issues

FILES ADDED OR CHANGED OUTSIDE THE PHASE SCOPE: product modules/adapters/engines, extended record/encryption/backup/search contracts, root navigation, offline cache/build plugins, tests and user guides. All are required by the explicit product-wide instruction. Original AGENTS/REQUIREMENTS/PHASE_PROMPTS stay unchanged. `.gitattributes` classifies format-padded PDF fixtures as binary documents.

DEPENDENCIES ADDED: chrono-node 2.8.0, date-fns 4.1.0, pdfjs-dist 5.4.394, write-excel-file 2.3.10, tesseract.js 6.0.1, tesseract.js-core 6.1.2, @tesseract.js-data/eng 1.0.0. Exact versions, purpose, licenses and measured cost are in DECISIONS.

DECISIONS MADE: user's sidebar/expanded-scope override; continue tested Phase 1; manual provider defaults and honest external limits; additive schemas and encrypted module/profile payloads; anchored balances/month-end billing; primary-only income scenarios; explicit currency separation; strict dietary and walking filters; approved buffered schedules; native ports of six animations; local optional OCR with pinned same-origin assets; readable portable backups; no fabricated ticket QR codes. All appended to DECISIONS.

FOUND ISSUES IN EARLIER PHASES: no unaddressed earlier-phase issue identified. Existing search/open/backup flows were adapted to the authorized page layout; previous contracts and migration tests remain. This branch continues the unmerged Phase 1 work rather than assuming main already contains it.

PROPOSED ADDITIONS: none beyond the supplied PDF/ZIP/transcript; additions listed above originate in the user's Gemini conversation.

QUESTIONS FOR THE HUMAN: none block running this local build. External accounts and provider-specific capabilities require a subsequent integration scope and credentials/configuration. They cannot be honestly pre-connected by source code alone.

## Verify by hand

1. Extract the source, enter the folder containing `package.json`, install Node 22.12+ and pnpm 11.19.0, then run `pnpm install --frozen-lockfile` and `pnpm dev`. Open the printed localhost URL.
2. Complete or skip setup, then edit savings/pay dates/working shifts/walking limits/diet. Reload and confirm preferences and Pet visibility persist.
3. Use Connections & privacy to deliberately load Sample data. Visit Briefing, Finance, Calendar, Food and Outdoors; inspect Sample badges, dark theme and 360 px navigation.
4. Cmd/Ctrl+J: enter `buy keyboard $150 on 11/20`, check preview and confirm. Move its marker/date, compare a scenario, and undo. Resolve a due purchase with actual final cost or a new postponed date.
5. Add a subscription due today; log an already-cleared charge. Inspect cleared balance, next renewal and export. Undo and confirm both history and transaction revert.
6. Drop receipt PDFs/text; enable optional OCR and drop a clear English PNG/JPEG. Review unclear values, accept, and download expense/planning CSV and XLSX. Confirm emotional columns are opt-in.
7. Create a contextual task, copy its AI prompt or opt into Sample AI, edit the proposed steps and approve. Confirm the Calendar blocks only appear after approval. Try the weekly reset draft and its date selector.
8. Save research, plan its purchase, reserve goal funds, check in on a habit, add a care date, and create an itinerary stop with your original ticket URL. Search those records with Cmd/Ctrl+K.
9. Scale a recipe, add missing groceries, compare permitted routes, plan a feasible hike, add missing gear to cart, log activity/contact/pet food, and finish or skip the weekly reset.
10. Export a private JSON backup. For offline use, `pnpm build` and `pnpm exec vite preview`, visit once and wait for service worker installation; disconnect and reload. Back up before clearing browser data. Live services remain unconnected.

## Source delivery

The implementation branch is published to `Joshuza/Catalyst`; main is preserved. Download the complete source with GitHub’s branch archive: https://github.com/Joshuza/Catalyst/archive/refs/heads/phase-2-complete-product.zip . The requested projectless output path `/codex/browser/projectless/0001-files-mentioned-by-the-user-uploaded-file-pointe/output` does not exist in this environment, and creating its root fails with filesystem Permission denied even outside the sandbox. This is a filesystem ownership limitation, not an automatic approval-review rejection. No inaccessible local download link is presented. The repository archive contains every committed source file, pinned lockfile, fixtures, tests, and run instructions.
