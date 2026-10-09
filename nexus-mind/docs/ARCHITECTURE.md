# NEXUS Mind — Architecture

## 1. System diagram

```
┌──────────────────────────────── Electron app ────────────────────────────────┐
│                                                                              │
│  MAIN PROCESS (Node, trusted)                 RENDERER (Chromium, sandboxed) │
│  ┌──────────────────────────────┐             ┌────────────────────────────┐ │
│  │ index.ts  boot sequence      │             │ React 18 + TypeScript      │ │
│  │ security.ts  CSP, nav guard, │             │                            │ │
│  │   permission + popup policy  │             │  App ─ boot gate (settings)│ │
│  │ window.ts  frameless window, │             │   └ AppShell               │ │
│  │   bounds persistence         │             │      ├ TitleBar  (⌘K)      │ │
│  │ hotkeys.ts  global summon    │             │      ├ Sidebar   (start)   │ │
│  │ menu.ts  native menu         │             │      ├ <lazy View/>        │ │
│  │                              │   typed     │      └ CommandPalette      │ │
│  │ ipc/dispatch.ts ◄────────────┼──── IPC ────┼── lib/bridge.ts            │ │
│  │   zod-validated, Result<T>   │  (invoke +  │                            │ │
│  │                              │   events)   │  stores/   Zustand         │ │
│  │ repositories/                │             │  React Query (server state)│ │
│  │   settings · workspace · kv  │             │  i18n/  en · ar · Intl     │ │
│  │ services/secrets.ts          │             │  theme/ CSS-variable tokens│ │
│  │   └ OS keychain (safeStorage)│             │  Framer Motion · Radix     │ │
│  │                              │             └────────────▲───────────────┘ │
│  │ db/  SqlDriver interface     │                          │                 │
│  │   ├ better-sqlite3 (app)     │             ┌────────────┴───────────────┐ │
│  │   ├ node:sqlite   (tests)    │             │ PRELOAD (sandboxed)        │ │
│  │   ├ migrations (user_version)│             │ contextBridge → window.nexus│ │
│  │   └ seed (en / ar demo data) │             │ allow-listed channels only │ │
│  └──────────────┬───────────────┘             └────────────────────────────┘ │
│                 │                                                            │
│          ┌──────▼──────┐        later modules:  AI providers (OpenAI /       │
│          │ nexus.db    │        Anthropic / Ollama) · Supabase E2E sync ·    │
│          │ SQLite, WAL │        Google Calendar · IMAP · webhooks · plugins  │
│          └─────────────┘                                                     │
└──────────────────────────────────────────────────────────────────────────────┘

                 src/shared/  ← pure TypeScript used by all three
                 ipc.ts (contract) · settings.ts · locale.ts · domain.ts
                 dates.ts · wikilinks.ts
```

### Key decisions

| Decision | Why |
|---|---|
| **One typed IPC contract** (`src/shared/ipc.ts`) | Main handlers, preload allow-list and renderer calls are all checked against it at compile time; zod validates every input at runtime. |
| **Errors are values across the bridge** (`IpcResult<T>`) | Electron flattens thrown errors into strings. A `{ code }` lets the UI localise every failure; internal details stay in the main-process log. |
| **SQLite in the main process only** | The renderer is sandboxed with no Node access. Synchronous better-sqlite3 calls take microseconds — faster than any async ORM. |
| **`SqlDriver` interface** | Production uses better-sqlite3 (Electron ABI); tests use Node's built-in `node:sqlite`, so `npm test` needs no native rebuild. |
| **Secrets never reach the renderer** | API keys are encrypted with the OS keychain (`safeStorage`); the UI can only ask "is a key set?". If the keychain is unavailable we refuse to store rather than fall back to plaintext. |
| **Boot gate on settings** | The first frame already has the right `lang`, `dir`, font and theme — no flash of LTR English for Arabic users. |
| **Lazy views + manual chunks** | Each module is its own chunk; React, Framer Motion and i18n are cached vendor chunks. |
| **Shortcuts match `KeyboardEvent.code`** | On an Arabic layout ⌘K produces `key: "ن"`; matching the physical key keeps every shortcut working. |

## 2. Arabic & RTL

* **Direction** — `<html dir>` is derived from the language (`auto`) or forced (`ltr`/`rtl`). All layout uses Tailwind logical utilities (`ms-`, `pe-`, `start-`, `end-`, `border-e`), so the sidebar, toasts and indicators mirror without per-component code.
* **Typography** — Tajawal (weights 400/500/700/800, Arabic + Latin subsets, bundled locally) is the default for Arabic and any RTL layout, and is first in the font picker. Every font stack keeps Tajawal as fallback so Arabic glyphs never fall back to a system font. Cal Sans headings fall back per glyph to Tajawal.
* **Script-correct CSS** — letter-spacing is forced to 0 under `:lang(ar)` (tracking breaks cursive joining); line-height is raised to 1.7 for diacritics; code, numbers and shortcut hints are bidi-isolated LTR.
* **Numbers & dates** — all formatting goes through `Intl` with a tag such as `ar-SA-u-nu-arab-ca-islamic-umalqura`: Arabic-Indic or Western digits, Gregorian or Hijri (Umm al-Qura) calendar, Saturday/Sunday/Monday week start.
* **Plurals** — Arabic strings define all six CLDR categories (zero, one, two, few, many, other); a unit test enforces it.
* **Motion & icons** — horizontal animations pass through `directionalX()`; directional icons use `rtl:-scale-x-100`; segmented controls map ←/→ to visual order.
* **Window chrome** — native controls are physically fixed (macOS traffic lights left, Windows overlay right) regardless of `dir`, so the title bar reserves *physical* padding.
* **Bilingual search** — each command-palette entry carries its English and Arabic labels as keywords, so either language finds it.

## 3. Folder structure

`✅` = shipped in this module, `◻` = planned for a later module.

```
nexus-mind/
├── package.json                 ✅ pinned deps, scripts (dev/build/test/dist:*)
├── electron.vite.config.ts      ✅ main / preload / renderer builds, CSP injection
├── electron-builder.yml         ✅ Win (NSIS) · macOS (DMG, arm64+x64) · Linux (AppImage, deb)
├── tailwind.config.ts           ✅ token-driven colours, font stacks
├── vitest.config.ts             ✅ node + jsdom environments
├── tsconfig*.json               ✅ strict, noUncheckedIndexedAccess
├── .env.example                 ✅
├── build/                       ✅ icon.svg/png, macOS entitlements
├── docs/ARCHITECTURE.md         ✅ this file
└── src/
    ├── shared/                  pure TS, no Electron/DOM
    │   ├── ipc.ts               ✅ channel contract + zod input schemas
    │   ├── settings.ts          ✅ schema, defaults, tolerant hydration
    │   ├── locale.ts            ✅ direction, font, digits, calendar resolution
    │   ├── domain.ts            ✅ Task, Project, Note, Habit, Journal, Focus types
    │   ├── dates.ts             ✅ local-day helpers, week start
    │   ├── wikilinks.ts         ✅ [[link]] parsing (Arabic-safe)
    │   ├── nlp/                 ◻ natural-language task + recurrence parsing (en/ar)
    │   └── scoring/             ◻ Eisenhower + urgency scoring, deadline risk
    ├── main/
    │   ├── index.ts             ✅ boot sequence
    │   ├── security.ts          ✅ hardening
    │   ├── window.ts            ✅ main window
    │   ├── hotkeys.ts menu.ts   ✅
    │   ├── logger.ts errors.ts  ✅
    │   ├── ipc/                 ✅ dispatch (validated) + register (sender check)
    │   ├── db/                  ✅ driver, migrations, migrate, seed (+ content en/ar)
    │   ├── repositories/        ✅ kv, settings, workspace   ◻ tasks, notes, habits, focus…
    │   ├── services/            ✅ secrets   ◻ ai/, sync/, calendar/, imap/, webhooks/
    │   └── windows/             ◻ multi-window (task / notes windows)
    ├── preload/index.ts         ✅ contextBridge API
    └── renderer/
        ├── index.html           ✅
        └── src/
            ├── main.tsx App.tsx ✅ fonts, providers, boot gate
            ├── styles/          ✅ globals.css (RTL + Arabic rules)
            ├── theme/           ✅ 6 themes   ◻ custom builder, sunrise auto-switch
            ├── i18n/            ✅ en, ar, Intl formatters   ◻ 11 more languages
            ├── lib/             ✅ bridge, hotkeys, cn, preview bridge
            ├── stores/          ✅ settings, ui, toasts
            ├── hooks/           ✅ useLocale (apply dir/lang/font/theme)
            ├── components/
            │   ├── shell/       ✅ AppShell, TitleBar, Sidebar, CommandPalette, Aurora
            │   ├── ui/          ✅ Card, Field, Segmented, Switch, Kbd, AnimatedNumber
            │   ├── ErrorBoundary.tsx Toaster.tsx ✅
            └── features/
                ├── registry.ts  ✅ lazy view registry
                ├── home/        ✅
                ├── settings/    ✅ appearance, language & region, AI keys, about
                ├── dashboard/   ◻   tasks/ ◻   calendar/ ◻   notes/ ◻
                ├── focus/       ◻   habits/ ◻  journal/ ◻    analytics/ ◻
                └── assistant/   ◻
```

## 4. Screens (ASCII)

### Home — English (LTR)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●            [ 🔍 Search or run a command…               ⌘K ]          │
├──────────────┬─────────────────────────────────────────────────────────────┤
│ [N] NEXUS    │  Friday, October 9, 2026                                    │
│              │  Good evening                     ← violet→cyan→amber       │
│ WORKSPACE    │  You have 1 task due today.                                 │
│▌⌂ Home    ⌘1 │                                                             │
│              │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│              │  │ ◎ 14   │ │ ▣ 1    │ │ ⏰ 1    │ │ ✓ 3    │                │
│              │  │ Open   │ │ Due    │ │ Overdue│ │ Done   │                │
│              │  └────────┘ └────────┘ └────────┘ └────────┘                │
│              │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│              │  │ ⏱ 5h45m│ │ ▤ 3    │ │ ✎ 5    │ │ 🔥 3    │                │
│              │  └────────┘ └────────┘ └────────┘ └────────┘                │
│ ⚙ Settings   │  ┌ ⌨ Keyboard first ──────────────────────────────────────┐ │
│ 文 العربية    │  │ Command palette  ⌘K     Settings          ⌘,           │ │
│ ◧ Collapse   │  └────────────────────────────────────────────────────────┘ │
└──────────────┴─────────────────────────────────────────────────────────────┘
```

### Home — Arabic (RTL, Tajawal, Arabic-Indic digits)

```
┌────────────────────────────────────────────────────────────────────────────┐
│          [ ⌘K               ابحث أو نفّذ أمرًا… 🔍 ]                  ─ □ ✕ │
├─────────────────────────────────────────────────────────────┬──────────────┤
│                                     الجمعة، ٩ أكتوبر ٢٠٢٦  │ نيكسس مايند [N]│
│                                              مساء الخير    │    مساحة العمل │
│                              لديك مهمة واحدة مستحقة اليوم.  │ ⌘1  الرئيسية ⌂▐│
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │              │
│  │    ٣ ✓ │ │    ١ ⏰ │ │    ١ ▣ │ │   ١٤ ◎ │               │              │
│  │ أُنجزت  │ │ متأخرة │ │ مستحقة │ │ مفتوحة │               │              │
│  └────────┘ └────────┘ └────────┘ └────────┘               │   الإعدادات ⚙ │
│                                                            │     English 文│
│                                                            │ طيّ الشريط ◨  │
└─────────────────────────────────────────────────────────────┴──────────────┘
```

### Command palette (⌘K)

```
          ┌──────────────────────────────────────────────────┐
          │ ✦  Type a command or search…                 Esc │
          ├──────────────────────────────────────────────────┤
          │ GO TO                                            │
          │ ▌⌂  Home                                     ⌘1  │
          │  ⚙  Settings                                 ⌘,  │
          │ PREFERENCES                                      │
          │  文  التبديل إلى العربية                           │
          │  ⇄  Flip layout direction                        │
          │  🎨 Next theme — Nebula                          │
          └──────────────────────────────────────────────────┘
```

## 5. Component tree

```
<StrictMode>
 └ <ErrorBoundary>                      app-level crash guard
    └ <QueryClientProvider>
       └ <App>                          boot gate: settings:get
          └ <MotionConfig reducedMotion>
             ├ <AppShell>               global hotkeys, app:command events
             │  ├ <Aurora/>             CSS-only animated backdrop
             │  ├ <TitleBar/>           drag region, palette trigger
             │  ├ <Sidebar/>            FEATURES registry, layoutId indicator
             │  ├ <main>
             │  │  └ <AnimatePresence>  direction-aware view transition
             │  │     └ <ErrorBoundary resetKey={view}>
             │  │        └ <Suspense>   lazy view chunk
             │  │           └ <HomeView/> | <SettingsView/>
             │  └ <CommandPalette/>     cmdk + Radix Dialog
             └ <Toaster/>
```

## 6. Module roadmap → the 50 features

| # | Module | Features |
|---|---|---|
| 1 | **Foundation** ✅ | shell, security, SQLite + migrations, typed IPC, settings, theme engine (6 themes), Arabic/RTL + Tajawal, command palette (#16), global hotkey (#17), offline-first core (#35), keyboard-first a11y (#43, partial), seed data, tests, packaging |
| 2 | Tasks | NL task creation in en/ar (#1), auto-prioritisation (#2), Kanban/List/Timeline/Matrix (#19), NL recurrence (#20), templates (#24), quick-capture inbox (#25), dependencies (#30) |
| 3 | Notes | TipTap editor, Markdown/LaTeX/Mermaid (#47), wikilinks + backlinks (#26), graph view (#27), zen mode (#41) |
| 4 | Calendar | Day/Week/Month/Year, drag-and-drop time-blocking (#18), Google sync |
| 5 | Focus, habits & journal | Pomodoro/deep work + ambient sound (#22), focus mode (#23), habit heatmaps (#21), journal with mood/energy (#28), sound design (#42) |
| 6 | Dashboard & analytics | Draggable widgets (#39), heatmaps and trends, goals/OKRs (#29) |
| 7 | AI layer | Provider abstraction (OpenAI / Anthropic / Ollama) in main, assistant sidebar with tool-calling, #3–#15 incl. embeddings + RAG and Whisper voice |
| 8 | Sync & power users | E2E sync (#31–#32), sharing and workspaces (#33–#34), theme builder and auto light/dark (#36, #45), fonts and density (#37, done in part), shortcut remapping (#38), multi-window (#40), 11 more languages (#44), plugin API (#46), import/export (#48), webhooks (#49), rules engine (#50) |
