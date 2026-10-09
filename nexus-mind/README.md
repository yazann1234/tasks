# NEXUS Mind

An AI-powered personal productivity OS for the desktop: Electron, React 18, TypeScript (strict), Tailwind, Framer Motion, Radix, Zustand, React Query and SQLite. It has full Arabic and RTL support, with Tajawal as the default Arabic font.

> **Status: Module 1 of 8, Foundation.** The shell, security model, database, typed IPC, settings, theme engine, Arabic/RTL support, command palette, global hotkey, demo data, tests and packaging are done and run. Tasks, Notes, Calendar, Focus, Analytics, AI and Sync come next, one module at a time. See the [roadmap](docs/ARCHITECTURE.md#6-module-roadmap--the-50-features).

## Quick start

```bash
cd nexus-mind
npm install          # also rebuilds better-sqlite3 for Electron (postinstall)
cp .env.example .env # optional, for development only
npm run dev          # launches Electron with hot reload
```

Requirements: Node ≥ 20.18 (Node 22 recommended; tests use the built-in `node:sqlite`). Building better-sqlite3 from source needs a C/C++ toolchain, but on common platforms a prebuilt binary is downloaded.

On first launch, NEXUS Mind detects the OS language. If it's Arabic, the app opens in Arabic, right-to-left, with Tajawal, Arabic-Indic digits and a Saturday week start, and the demo workspace is seeded in Arabic. You can change any of this in **Settings → Language & region** or with **⌘K → التبديل إلى English**.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Electron + Vite dev server with HMR |
| `npm run build` | Typecheck both projects, then bundle main, preload and renderer into `out/` |
| `npm test` | Vitest: shared logic, migrations, seed, repositories, IPC dispatch, i18n, hotkeys, DOM locale |
| `npm run typecheck` | `tsc --noEmit` for the Node (main/preload) and web (renderer) projects |
| `npm run dist:win` | NSIS installer (x64 + arm64) in `release/<version>/` |
| `npm run dist:mac` | DMG (arm64 + x64), hardened runtime |
| `npm run dist:linux` | AppImage and .deb |

The CI workflow in `.github/workflows/nexus-mind.yml` typechecks and tests on every push. It builds installers for all three platforms on tags or manual dispatch.

## Keyboard

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Command palette (bilingual fuzzy search) |
| `⌘1` | Home |
| `⌘,` | Settings |
| `⌘\` | Toggle sidebar |
| `Ctrl+Shift+Space` | Summon NEXUS Mind from anywhere (configurable) |

Shortcuts match physical keys, so they also work on an Arabic keyboard layout.

## Security model

* The renderer runs with `sandbox: true`, `contextIsolation: true` and `nodeIntegration: false`. A strict CSP is injected into production builds.
* The renderer reaches the main process only through `window.nexus`, an allow-list of channels defined in `src/shared/ipc.ts`. Every input is validated with zod, and calls from frames other than the app's own are rejected.
* Navigation away from the app, `window.open` and `<webview>` are blocked. External `https` links open in the default browser.
* Permissions are denied by default; only notifications and clipboard writes are allowed.
* API keys are encrypted with the OS keychain via Electron `safeStorage`, and the renderer can't read them back. If the keychain is unavailable, keys aren't stored at all, so they never land on disk in plaintext.

## Data

Everything is stored locally in `nexus.db` (SQLite, WAL) in the OS app-data folder:

* macOS: `~/Library/Application Support/NEXUS Mind/`
* Windows: `%APPDATA%\NEXUS Mind\`
* Linux: `~/.config/NEXUS Mind/`

Migrations are append-only and tracked in `PRAGMA user_version`. A database written by a newer version is refused rather than modified. Set `NEXUS_SEED_DEMO=false` to start with an empty workspace.

## UI work in a browser

Running `npm run dev` and opening the Vite URL in a regular browser starts a development-only preview bridge. It keeps settings in localStorage and serves demo counts, so you can iterate on UI without Electron. Packaged builds never fall back to it.

## Troubleshooting

* **`NODE_MODULE_VERSION` mismatch / better-sqlite3 fails to load**: run `npx electron-builder install-app-deps` to rebuild it for Electron.
* **Linux: the window doesn't open in a container/VM**: run with `--no-sandbox` for local testing only.
* **The global hotkey doesn't work**: another app owns the combination. A different one can be set in settings (the remapping UI comes in Module 8).

## Notes on the stack

`package.json` only includes dependencies the shipped code actually imports. TipTap, Recharts, D3 and the Supabase and AI SDKs will be added, pinned, in the modules that use them. For the AI layer, the plan is to default to current models (for example Claude and GPT model families available at build time) rather than the older GPT-4o / Claude 3.5. Ollama will be the local fallback.

Architecture, folder structure, screen mock-ups and the component tree are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
