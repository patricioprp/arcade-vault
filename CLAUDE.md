# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project overview

Arcade Vault is an online gaming platform where players compete for the highest scores. The repo is currently a fresh `create-next-app` scaffold (single route in `app/page.tsx`), so most of the architecture is still to be built.

Development follows **Spec Driven Design** using the `/spec` (write a spec) and `/spec-impl` (implement a spec) skills from [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills), installed with `npx skills@latest add Klerith/fernando-skills`. Write or update the spec before implementing a feature, and follow the skills' conventions.

## Commands

```bash
npm run dev     # next dev (Turbopack)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint (flat config: next core-web-vitals + typescript)
npx tsc --noEmit  # type-check (no dedicated script)
```

No test runner is configured yet.

## Stack and configuration

- **Next.js 16.4 (App Router) + React 19.3 + TypeScript (strict)**. As `AGENTS.md` says, this Next.js version differs from training data — consult `node_modules/next/dist/docs/` (`01-app`, `03-architecture`, …) before using any Next API.
- `next.config.ts` enables `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. With Cache Components, data fetching and caching follow the `"use cache"` / Suspense model rather than the older `fetch` cache options — check the docs before adding data loading.
- **Tailwind CSS v4**, wired through Turbopack via the `@tailwindcss/turbopack` loader for `*.css` (configured in `next.config.ts`, no `postcss.config`). Theme tokens are declared with `@theme inline` in `app/globals.css`; there is no `tailwind.config` file.
- Page/layout props use Next's generated global types (e.g. `LayoutProps<"/">`), produced under `.next/types` by `next dev`/`next build`.
- Path alias `@/*` maps to the repo root.

## Skills
Usa siempre /frontend-design para diseñar la interfaz de usuario.