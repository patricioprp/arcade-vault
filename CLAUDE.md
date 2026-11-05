# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project overview

Arcade Vault is a retro online gaming platform (UI in Spanish, `lang="es"`) where players compete for the highest scores. Routes:

- `/` home · `/juegos` library · `/juegos/[id]` game detail (top 10 + play count) · `/juegos/[id]/jugar` player
- `/salon-de-la-fama?juego=<id>` Hall of Fame · `/about` about + contact form (Resend) · `/login` local "auth"
- `/api/health/db` Supabase health check

The list of implemented (playable) games is in [references/implemented-games.md](references/implemented-games.md). Catalog ids not listed there run a simulated arena in the player.

## Workflow: Spec Driven Design

- Write or update a spec in `specs/NN-slug.md` with `/spec` before implementing, then implement it with `/spec-impl` (creates branch `spec-NN-slug` automatically, see `specs/.spec-config.yml`). Skills from [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills) (`npx skills@latest add Klerith/fernando-skills`).
- Specs so far: 01 MVP screens · 02 homepage · 03 about/contact · 04 Supabase base · 05 ROCAS · 06 leaderboard · 07 CAÍDA · 08 BLOQUE BUSTER · 09 SERPENTINA.
- One PR per spec, merged into `main`.
- To choose the next game, ask `@game-planner` first (see Agents below); its handoff feeds `/nuevo-juego`.

## Skills (`.claude/skills/`)

- `/spec`, `/spec-impl` — spec authoring and implementation (above).
- `/nuevo-juego` — project skill to add or port a playable game (from `references/started-games/`, a simulated catalog id, or a new idea). Produces the spec ready for `/spec-impl`. Its `contrato.md` is the source of truth for the game ↔ player contract and file layout.
- `/frontend-design` — **always** use it to design UI (covers, screens, components).

## Agents (`.claude/agents/`)

### `@game-planner` (`.claude/agents/game-planner.md`)

Plans, reasons about and decides which game fits Arcade Vault next. It never writes app code or specs: it recommends and hands off to `/nuevo-juego`. Replies in Spanish.

- **Config**: `model: opus`, `tools: Read, Glob, Grep, Write, Edit` (no Bash), `memory: project`. Writes only inside its memory directory.
- **Reads before deciding** (fresh every run): its `MEMORY.md`, `references/implemented-games.md`, `lib/games.ts` (catalog; ids missing from `components/games/registry.ts` are simulated, i.e. cheap candidates), `references/started-games/`, `.claude/skills/nuevo-juego/contrato.md` and `specs/`. If memory contradicts the repo, the repo wins and memory is corrected.
- **Rubric** (1–5 each, total /25):
  - Aesthetics: retro/CRT/neon look and a good uppercase Spanish title.
  - Competition: clearly growing score, short replayable runs, high ceiling (RPC accepts 1–10,000,000).
  - Technical fit: canvas 2D, single player, keyboard, pure engine, `onStats`/`onGameOver`.
  - Catalog balance: under-represented category/color/difficulty among playable games.
  - Effort (inverse): 5 = reference in `started-games/` or existing simulated id; 1 = new complex mechanic.
- **Process**: 3–5 candidates → filter out implemented and `descartado` ones (flags repeats of earlier `sugerido`) → score → 1 recommendation + 1–2 alternatives.
- **Output**: comparison table, card for the pick (id, TITLE, category, color, difficulty, one-line catalog description, mechanic and scoring, why now, risks) and a ready-to-paste handoff line (`/nuevo-juego <id or description>`).
- **Memory** (`.claude/agent-memory/game-planner/`, committed to git; `MEMORY.md` is auto-injected when the agent starts):
  - `MEMORY.md` (<200 lines): catalog snapshot, suggestions table `| Fecha | id | Título | Categoría | Estado | Motivo |` with absolute dates, and a **Preferencias del usuario** section the agent must respect.
  - States: `sugerido` · `aceptado` · `descartado` · `implementado`, plus `evaluado` (scored but not proposed). `descartado` ideas are never re-proposed unless the user asks.
  - Long cards go in `ideas/<id>.md`, linked from the table.
  - Updated at the end of every run; existing rows are updated, not duplicated. Tell the agent when you accept/discard an idea so it records it.
- **Pipeline**: `@game-planner` → `/nuevo-juego <id>` (spec) → `/spec-impl` (branch + implementation) → update `references/implemented-games.md` (the agent then marks the game `implementado`).
- **Current state** (2026-11-03): 20 suggestions, 5 per category (top: `duelo-pixel` 23 with redesigned vs-CPU scoring, `invasores` 22, `columnas` 22). Prioritized checklist with `/nuevo-juego` handoffs in `.claude/agents/game-suggestion-todo.md`. All reference games in `started-games/` are already ported.

### `@game-jam` (`.claude/agents/game-jam.md`)

Takes a **theme** and designs **one** game for it, written as **at least two complete specs**, each an alternative variant (different mechanic, rules or scoring) of the same game. Replies in Spanish; decides on its own (no questions) and records every choice under **Decisiones**.

- **Config**: `model: opus`, `tools: Read, Glob, Grep, Write, Edit` (no Bash), no memory. Writes only inside `specs/game-jam/<game-id>/`.
- **Output**: `specs/game-jam/<game-id>/<NN>-variante-<a|b|c>-<slug>.md` (`01` = A, `02` = B, `03` = C), status `borrador`, no global `NN`. Same sections and level of detail as specs 07/08/09, with an extra `Tema` line in the header. Reads `contrato.md`, `plantilla-spec.md`, `lib/games.ts`, the registry and `@game-planner`'s memory (read-only, to skip `descartado` ideas).
- **Pipeline**: `@game-jam <tema>` → review the variants → copy the chosen one to `specs/NN-juego-<id>-<slug>.md` as `aprobado` → `/spec-impl`.

### `@skin-designer` (`.claude/agents/skin-designer.md`)

Audits that every playable game has at least 3 skins — `neon` (default, current look), `retro` (monochrome phosphor) and `clasico` (flat colors of the original game) — and, when something is missing, designs the palettes and writes the spec. Replies in Spanish; decides on its own and records choices under **Decisiones**.

- **Config**: `model: opus`, `tools: Read, Glob, Grep, Write, Edit` (no Bash), no memory. Writes only `specs/NN-skins-*.md` (status `borrador`); never app code.
- **Convention it audits**: shared `lib/skins.ts` (`SkinId`, `SKIN_IDS`, `SKIN_LABELS`, `DEFAULT_SKIN`), per-game `lib/<slug>/skins.ts` with `SKINS satisfies Record<SkinId, <Slug>Palette>`, `render.ts` with no hardcoded colors, selector + `localStorage` persistence in the player, and `contrato.md`/`plantilla-spec.md` requiring skins. Skins are cosmetic only (never touch the engine or scoring); playable elements need ≥ 4.5:1 contrast.
- **Output**: audit table (OK / PARCIAL / SIN SKINS per game) and, if needed, `NN-skins-base.md` (first time: system + skins for all games) or `NN-skins-<id>.md` / `NN-skins-completar.md`.
- **Pipeline**: `@skin-designer` → review the spec → `aprobado` → `/spec-impl`.

- New agents are only picked up by a fresh Claude Code session (the `/agents` wizard was removed; edit `.claude/agents/` directly).

## Commands

```bash
npm run dev       # next dev (Turbopack)
npm run build     # production build
npm run start     # serve the production build
npm run lint      # eslint (flat config: next core-web-vitals + typescript)
npx tsc --noEmit  # type-check (no dedicated script)
npm run db:new -- <name>  # new Supabase migration
npm run db:push           # apply migrations (needs SUPABASE_DB_PASSWORD exported in the shell)
npm run db:types          # regenerate lib/supabase/database.types.ts
```

No test runner is configured. Verify UI changes in the browser (Playwright MCP is available).

## Stack and configuration

- **Next.js 16.4 (App Router) + React 19.3 + TypeScript (strict)**. As `AGENTS.md` says, this Next.js version differs from training data — consult `node_modules/next/dist/docs/` before using any Next API.
- `next.config.ts` enables `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. Data loading uses `"use cache"` + `cacheLife`/`cacheTag` and `<Suspense>` boundaries around anything that reads `params`/`searchParams`; pages keep a static shell and stream the dynamic part.
- **Tailwind CSS v4** via the `@tailwindcss/turbopack` loader (in `next.config.ts`, no `postcss.config`). Tokens use `@theme inline` in `app/globals.css`, which also holds the hand-written retro/CRT styles (`av-*`, `crt`, `cover-*` classes). No `tailwind.config`.
- Fonts (`next/font/google`): Press Start 2P, JetBrains Mono, Courier Prime.
- Page/layout props use Next's generated global types (`PageProps<"/juegos/[id]">`, `LayoutProps<"/">`).
- Path alias `@/*` maps to the repo root.
- Env vars: see `.env.example` (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_PASSWORD` for the CLI only). Real values go in `.env.local`.

## Architecture

### Data (Supabase)

- Tables `games` (`id`, `title`, `playable`) and `scores`, RLS read-only for `anon`. **The only write path is the `submit_score` RPC** (security definer; validates playable game, name 1–10 chars uppercased, score 1–10,000,000). Reads use `get_leaderboard` (best score per player) and `get_player_best`.
- Schema changes only via migrations in `supabase/migrations/`; then `npm run db:types`. Making a game playable = migration `<ts>_playable_<id>.sql` setting `playable = true`.
- Three clients in `lib/supabase/`: `server.ts` (cookies, per request), `anon.ts` (no cookies — use inside `"use cache"`), `client.ts` (browser).
- `lib/leaderboard.ts` (`server-only`): `getLeaderboard` / `getPlayCount`, cached with tag `leaderboard:<id>`. The `submitScore` Server Action (`app/juegos/[id]/jugar/actions.ts`) calls the RPC and invalidates with `updateTag`. Cached readers throw on error instead of caching an empty result.
- Supabase MCP is configured in `.mcp.json`.

### Games

- Implemented games (id, title, category, description, color): see [references/implemented-games.md](references/implemented-games.md). Keep that file updated when a game becomes playable.

- Catalog: `lib/games.ts` (`GAMES`, `getGame`) — static metadata (title, texts, category, cover class, color, difficulty).
- Player: `components/game-player.tsx` owns HUD, pause (button/`P`/`Escape`/tab hidden), GAME OVER modal, saving with `submitScore`, and restart (remounts the game via `key`). Games must not duplicate this.
- Registry: `components/games/registry.ts` maps catalog id → component (`PlayableGameProps`: `paused`, `onStats`, `onGameOver`). Ids not in `PLAYABLE_GAMES` use the simulated arena.
- Each game is split into `lib/<slug>/engine.ts` (pure TS, no DOM/React/rAF/Audio), `lib/<slug>/render.ts` (canvas drawing) and `components/games/<slug>.tsx` (canvas, input, game loop). Assets under `public/games/<id>/`.
- `references/` holds the original design templates and the started games being ported (reference material only — copy/port from it, never import it from app code).

### Other

- Player identity is local only: `lib/user-store.ts` (`useUser`, `localStorage` key `av_user`, `useSyncExternalStore`). No Supabase Auth yet.
- Contact form: `components/contact-form.tsx` + `sendContact` Server Action (`app/about/actions.ts`, Resend) with shared validation in `lib/contact.ts`.
- Dates are formatted in `America/Argentina/Buenos_Aires` (`lib/scores.ts`) so server and client match.

## Claude Code setup

- `.claude/settings.local.json` hooks: after every `Write`/`Edit`, `.claude/hooks/format-and-lint.mjs` runs Prettier + `eslint --fix` on the file and reports lint errors back (fix them, don't bypass); `Stop`/`Notification` play a sound.
- Prettier uses defaults (`.prettierrc.json` is `{}`).
