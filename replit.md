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

- `artifacts/who-said-it-ke/src/App.tsx` — game state, live/demo question loading, scoring, persistence, and app views
- `artifacts/who-said-it-ke/src/index.css` — visual theme, responsive layout helpers, focus states, and motion
- `artifacts/api-server/src/routes/questions.ts` — server-side X recent-search adapter and five-question round builder
- `artifacts/who-said-it-ke/.replit-artifact/artifact.toml` — artifact routing and managed web workflow
- `lib/api-spec/openapi.yaml` — source of truth for the generated `/api/questions` contract

## Architecture decisions

- xAI's Grok API is called only from the API server with the `XAI_API_KEY` Replit Secret (with the existing `X_BEARER_TOKEN` secret accepted as a compatibility alias); the browser never receives credentials.
- Live rounds use xAI's X Search tool to prioritize popular public posts from recognizable Kenyan voices and link back to the original X post; the local question pool is an explicitly labeled fallback for xAI outages, credit limits, or missing credentials.
- `getDailyChallenge(date)` remains a deterministic fallback so the core loop stays playable without accounts or a database.
- Browser Web Share is preferred, with clipboard, WhatsApp, and X fallbacks for friend sharing.

## Product

- Players start a daily five-question run after an energetic countdown, using recent Kenyan-context public posts from X when available.
- Each question has four shuffled options, a 10-second timer, speed-based scoring, one hint, feedback, and combo tracking.
- Live questions identify the public post author and provide an “Open original post” link; demo fallback rounds are visibly labeled.
- Results include score, rank, streak, performance details, and a spoiler-free share/challenge flow.
- Home, leaderboard period tabs, profile editing, achievements, sound preference, and local score persistence are included.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
