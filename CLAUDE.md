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

## Skills (`.claude/skills/`)

- `/spec`, `/spec-impl` — spec authoring and implementation (above).
- `/nuevo-juego` — project skill to add or port a playable game (from `references/started-games/`, a simulated catalog id, or a new idea). Produces the spec ready for `/spec-impl`. Its `contrato.md` is the source of truth for the game ↔ player contract and file layout.
- `/frontend-design` — **always** use it to design UI (covers, screens, components).

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
