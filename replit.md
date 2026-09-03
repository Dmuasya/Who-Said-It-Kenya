# Who Said It? Kenya

A mobile-first quote guessing game with Quickfire, Classic, and Marathon runs, speed scoring, streaks, leaderboards, profiles, and spoiler-free friend challenges.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/who-said-it-ke/src/App.tsx` — game state, local dataset question building, scoring, persistence, and app views
- `artifacts/who-said-it-ke/src/data/kenyaXPosts.ts` — normalized, deduplicated public X-post dataset used by the game
- `artifacts/who-said-it-ke/src/index.css` — visual theme, responsive layout helpers, focus states, and motion
- `artifacts/who-said-it-ke/.replit-artifact/artifact.toml` — artifact routing and managed web workflow
- `lib/api-spec/openapi.yaml` — health-check API contract only; game content is local

## Architecture decisions

- Game rounds do not call an external API. They use the normalized local dataset of exact public X posts, with each question linking to its original post.
- `getDailyChallenge(date)` remains a deterministic fallback so the core loop stays playable without accounts or a database.
- Browser Web Share is preferred, with clipboard, WhatsApp, and X fallbacks for friend sharing.

## Product

- Players choose Quickfire (5 questions / 50 seconds), Classic (10 / 90 seconds), or Marathon (25 / 3 minutes) after an energetic countdown.
- Each question has four shuffled options, mode-specific per-question timing, speed-based scoring, one hint, feedback, and combo tracking.
- Curated questions identify the public post author and provide an “Open original post” link; fictional demo fallback rounds are visibly labeled.
- Results include score, rank, streak, performance details, and a spoiler-free share/challenge flow.
- Home, leaderboard period tabs, profile editing, achievements, sound preference, and local score persistence are included.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
