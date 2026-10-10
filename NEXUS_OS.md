# Nexus OS foundation

Phase 0 only. The canvas contains three labeled Sample tiles with working expand, collapse, and dim controls. There are no user records, finance calculations, tickets, task groups, imports, adapters, or network integrations yet.

## Run locally

Use Node 22.12 or newer and the pinned pnpm version in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite. To test offline behavior, serve a production build, visit once, let the service worker finish installing, and then reload offline:

```sh
pnpm build
pnpm exec vite preview
```

Service workers require HTTPS or localhost. Installing the PWA is browser-dependent. The manifest includes locally generated 192 and 512 pixel PNG icons; no external assets are fetched.

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

For a machine with system Chromium, set `NEXUS_CHROMIUM_PATH` to its executable when running e2e. Otherwise install the matching browser using `pnpm exec playwright install chromium`. The cloud verification used `/usr/bin/chromium`. In this restricted workspace, pnpm's home and store were configured under `/workspace/work`; ordinary local development does not need these environment-specific paths.

## Architecture

`src/domain` contains pure rules and utilities; `data` and `adapters` may import domain; `engine` may import domain; `ui` may import engine, data, and domain. ESLint enforces this direction, including literal dynamic imports and re-exports. Domain code cannot use React or browser storage. Every top-level source directory has its own README.

Theme is the only persisted setting and uses localStorage. Sample tile presentation uses an ephemeral Zustand store. There is no database or encryption layer until Phase 1, and no sample records are silently seeded.

The app has light, dark, and system themes, local system fonts, centralized design tokens, CSS modules, reduced-motion overrides, and a React error boundary. The service worker caches the shell, bundled JavaScript/CSS, icons, and manifest for offline reloads after the first completed visit.

## Specifications and later animations

`AGENTS.md`, `docs/REQUIREMENTS.md`, and `docs/PHASE_PROMPTS.md` are the supplied specifications, copied unchanged. The visual specification PDF mentioned by those files was not included in the ZIP.

The user's six animation fragments are retained as an integration contract in `docs/DECISIONS.md`: ReceiptPrinter, Ticket, PlayingCard, DynamicButton, HoldToConfirmButton, and MagneticDropZone. They are scheduled for their relevant later phases. That contract records required React/Vite, plain CSS, local asset, accessibility, and finance-state adaptations. No animation library is installed or product animation claimed in Phase 0.

Read `docs/PROGRESS.md` for actual checks, scope boundaries, and verification steps. The next build is Phase 1 after Phase 0 is reviewed and merged. No merge or remote push has been performed.
