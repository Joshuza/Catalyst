# Progress

## Completed phases

- Phase 0 Foundation: complete, published on main.
- Phase 1 Data layer and search: complete on phase-1-data-search; awaiting review and merge.

## Current run

```text
PHASE: 1 Data layer, command infrastructure, and global search
BRANCH: phase-1-data-search
COMMITS: 2; data: add encrypted storage, undo commands and local search; ui: add Spotlight, record tools and hold-to-delete

STATUS: COMPLETE for Phase 1

REQUIREMENTS COVERED: UX-04 (search), UX-05 (stored-record mutations), UX-07, SRCH-01 through SRCH-06.
REQUIREMENTS NOT COVERED: None within Phase 1. Command-bar shortcuts and the remaining product modules belong to later phases.

CHECKS (actual results from this run):
  typecheck: PASS, zero errors
  lint: PASS, zero errors and zero warnings
  unit tests: 71 passed, 0 failed, 0 skipped
  build: PASS
  e2e: 10 passed, 0 failed

REQUIREMENT TO TEST MAP:
  UX-04 / SRCH-01 / SRCH-03 / SRCH-06: e2e/data-search.spec.ts, "SRCH-01 to SRCH-06: keyboard Spotlight, required filters, secondary actions, focus and private storage".
  UX-05: src/test/commands.test.ts, "undoes and redoes create, edit, and soft delete"; e2e/data-search.spec.ts, "UX-05: create, edit, hold-delete, undo and redo Note and Transaction with keyboard only".
  UX-07: src/data/storage.test.ts, encrypted round-trip, missing-key, tamper and migration cases; e2e/data-search.spec.ts, "UX-07: durable data, atomic backups, sample removal and tamper error without a crash"; existing offline and external-origin foundation tests.
  SRCH-02 / SRCH-04: src/engine/search.test.ts, "uses the required receipt and unread-sender sentences verbatim" and "searches all five kinds, excludes tombstones, groups results and offers actual quick actions".
  SRCH-05: e2e/hold-actions.spec.ts, "SRCH-05: new task and month export verbs perform real local actions".
  Additional contracts: money.test.ts (1,000 seeded property cases), backup.test.ts (all six record types and invalid files), storage.test.ts (plaintext/encrypted migrations), HoldToConfirmButton.test.tsx and hold-actions.spec.ts (cancellation and successful persistence before confirmation).

FILES ADDED OR CHANGED OUTSIDE THE PHASE SCOPE: None.
DEPENDENCIES ADDED: dexie 4.2.1, zod 4.1.12, minisearch 7.2.0; development-only fast-check 4.3.0 and fake-indexeddb 6.2.4.
DECISIONS MADE: Strict validated records; field-wise AES-GCM and honest vault limits; plaintext portable backups capped at 20 MiB; atomic merge/import and soft-delete inverse patches; session-only history; in-memory deterministic search; opt-in removable Sample data; CSS adaptations of DynamicButton and HoldToConfirmButton. All recorded in DECISIONS.md.
DEFERRED: Phases 2 through 12, including ReceiptPrinter, Ticket, PlayingCard and MagneticDropZone integrations. Phase 1 awaits review and merge before Phase 2.
FOUND ISSUES IN EARLIER PHASES: None.
PROPOSED ADDITIONS: None.
QUESTIONS FOR THE HUMAN: None blocking this phase. The visual PDF remains absent from the attachments.

HOW TO VERIFY BY HAND:
  1. Fetch origin, switch to phase-1-data-search, run pnpm install --frozen-lockfile and pnpm dev, and open the printed URL.
  2. Create a note and a transaction; save, reload and reopen them.
  3. Load Sample data under Data and backups. Open Cmd/Ctrl+K and try receipt, receipts over $100 in October, and unread from Maria.
  4. Use arrows and Enter to open a result, Tab to reach Copy amount, and Escape to return focus to the canvas.
  5. Edit a record, hold Enter/Space or the delete button for 1.6 seconds, then undo and redo. Early release cancels deletion.
  6. Export and import a JSON backup, undo the import, and remove Sample data while keeping your own records.
  7. Run pnpm build and pnpm exec vite preview. Visit once online, then reload offline. Check 360 px width, dark theme and reduced motion.
```

## Verification details

- Final unit output: `Test Files 10 passed (10); Tests 71 passed (71)`. No tests skipped.
- Final typecheck and ESLint each exited 0; no compiler errors or lint warnings.
- Search benchmark, 50,000 deterministic records: receipt 26.71 ms; receipts over $100 in October 9.96 ms; unread from Maria 14.39 ms; indexed item 49999 0.07 ms. Measurements are from this VM, not a certification of every query on all hardware. The limit stayed at 50 ms throughout development.
- Final Playwright output: `10 passed (23.5s)`. Empty-profile browser load and search readiness measured 408.5 ms, below the unchanged 2,000 ms budget. Finance drag performance is not applicable until the finance engine exists.
- Storage tests reopen the database, reject missing keys, detect tampered ciphertext and metadata, and migrate both plaintext and encrypted version-1 fixtures without losing the device key. Migration snapshots are written before transformations.
- Browser tests start from fresh contexts and from the previous phase theme-only profile, assert no page errors on the core journeys, reload with real encrypted records, work offline, and verify no external-origin requests. They inspect IndexedDB stores and localStorage to confirm the index is not persisted.
- Sample removal preserves a user-created task. Note and Transaction create/edit/delete each have browser undo/redo coverage. Pointer release, movement outside, keyboard release, blur, disable, unmount and failed persistence are covered by the hold-control tests.
- Light desktop and dark mobile search layouts were visually inspected. Focus starts in the main field, wraps within the modal, and returns to the opener. The original four Phase 0 browser flows still pass.
- All source and test files are below 400 lines. Long declarative React functions, fixture tables and sequential test journeys have recorded reasons in DECISIONS.md. The 18 original layer tests and 20 text-token contrast tests remain intact.
- Final production assets: JavaScript 362,246 bytes (115,679 gzip at level 9), CSS 20,359 bytes (4,306 gzip). Compared with Phase 0, the combined feature and dependency growth is 208,269 JavaScript bytes (65,376 gzip).
- Build scripts, generated assets, pnpm cache files, screenshots and test output are not committed. Owned preview servers were stopped. Browser setup emits NO_COLOR/FORCE_COLOR environment warnings, separate from lint and page errors.

## Remaining phases

| Phase | Scope | Status |
| --- | --- | --- |
| 2 | Onboarding | Deferred |
| 3 | Financial simulator and sentinel | Deferred |
| 4 | Survey and receipts | Deferred |
| 5 | Command terminal and calendar | Deferred |
| 6 | Tri-fold inbox | Deferred |
| 7 | Tasks and AI decomposer | Deferred |
| 8 | Recipes, groceries and transit | Deferred |
| 9 | Hikes and activities | Deferred |
| 10 | Pet, CRM, screen time and Sunday Reset | Deferred |
| 11 | Morning briefing and progressive disclosure | Deferred |
| 12 | Hardening and complete cross-module verification | Deferred |

## Found issues

No earlier-phase defects were changed. The visual PDF is still not supplied. Missing-key recovery needs a portable backup imported on a fresh device/browser profile; no key recovery service is implemented or promised. Encryption and readable-export limits are described in DECISIONS.md and beside the backup controls.

## Proposed additions

None beyond the previously requested animations. DynamicButton and HoldToConfirmButton are implemented in this phase; the remaining four components stay assigned to later phases.

## Open questions

None block Phase 1. Review and merge its branch before starting Phase 2.
