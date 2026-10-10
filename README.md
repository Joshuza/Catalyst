# Catalyst
Catalyst is an all-in-one life command center unifying predictive 3-line finance tracking, smart scheduling, AI task breakdown, recipes, transit, and an encrypted inbox into one minimalist dark-mode dashboard.

The current implementation is Phase 1: local records, encrypted sensitive fields, undo/redo, JSON backups, and offline search. The full product described above is being built in the attached specification's phases.

Run the new branch:

```sh
git fetch origin
git switch phase-1-data-search
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL Vite prints. Read [NEXUS_OS.md](NEXUS_OS.md) for prerequisites and controls, and [docs/PROGRESS.md](docs/PROGRESS.md) for the verified scope.
