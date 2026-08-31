# Who Said It? Kenya

A mobile-first fictional quote guessing game with five-question daily runs, speed scoring, streaks, leaderboards, profiles, and spoiler-free friend challenges.

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

- `artifacts/who-said-it-ke/src/App.tsx` — game state, local demo question pool, scoring, persistence, and app views
- `artifacts/who-said-it-ke/src/index.css` — visual theme, responsive layout helpers, focus states, and motion
- `artifacts/who-said-it-ke/.replit-artifact/artifact.toml` — artifact routing and managed web workflow
- `artifacts/api-server` — shared API scaffold; not required by the local-only game MVP

## Architecture decisions

- The first release is intentionally local-only: localStorage makes the core loop instant and keeps demo play usable without accounts or a database.
- All quotes and politicians are explicitly fictional demo data to avoid presenting fabricated claims about real people.
- `getDailyChallenge(date)` provides a deterministic date-based question selection seam for a future verified content source.
- Browser Web Share is preferred, with clipboard, WhatsApp, and X fallbacks for friend sharing.

## Product

- Players start a daily five-question classic run after an energetic countdown.
- Each question has four shuffled options, a 10-second timer, speed-based scoring, one hint, feedback, and combo tracking.
- Results include score, rank, streak, performance details, and a spoiler-free share/challenge flow.
- Home, leaderboard period tabs, profile editing, achievements, sound preference, and local score persistence are included.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
