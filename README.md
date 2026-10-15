# IDLE Arcade

A room-based idle/arcade web game. This repository is an npm workspaces monorepo:

| Path        | What                                                                                |
| ----------- | ----------------------------------------------------------------------------------- |
| `frontend/` | Vite + React SPA (Tailwind CSS, TanStack Router, TanStack Query, tRPC client)       |
| `backend/`  | Node.js/TypeScript API: Express serving a single tRPC endpoint, Prisma, Better Auth |
| `docs/`     | Design material, e.g. the UI mockup `IDLE Arcade.excalidraw`                        |

## Prerequisites

- Node.js 24 (see `.nvmrc`) and npm 11+
- Docker with Docker Compose

## Local development

Run MySQL in Docker and both apps on your machine with hot reload:

```sh
cp .env.example .env                  # Compose settings: set the passwords and BETTER_AUTH_SECRET
cp backend/.env.example backend/.env  # Backend settings: use the same root password and secret
npm install                           # also generates the Prisma client
docker compose up -d mysql            # wait until `docker compose ps` shows "healthy"
npm run db:migrate                    # apply database migrations
npm run dev                           # backend on :3000, frontend on http://localhost:5173
```

Generate a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

The Vite dev server forwards `/trpc` to the backend, so the browser only ever talks to one origin
(no CORS, session cookies just work).

## Full stack in Docker

```sh
cp .env.example .env   # if not done yet
docker compose up --build
```

Open http://localhost:8080. Compose starts three containers:

- `mysql`: MySQL 8.4 with a named volume (`mysql-data`)
- `backend`: waits for MySQL to be healthy, runs `prisma migrate deploy`, then starts the API
- `frontend`: nginx serving the built SPA and forwarding `/trpc` to `backend`

Use `docker compose down -v` to also delete the database volume.

## Scripts (run from the repository root)

| Script                | What it does                                                         |
| --------------------- | -------------------------------------------------------------------- |
| `npm run dev`         | Start backend (`tsx watch`) and frontend (Vite) together             |
| `npm run build`       | Build both workspaces                                                |
| `npm run typecheck`   | Type-check both workspaces                                           |
| `npm run lint`        | ESLint over the whole repository                                     |
| `npm run format`      | Format with Prettier (`format:check` only checks)                    |
| `npm run db:migrate`  | Create/apply migrations after editing `backend/prisma/schema.prisma` |
| `npm run db:generate` | Regenerate the Prisma client                                         |
| `npm run db:studio`   | Open Prisma Studio                                                   |

## Configuration

Never commit `.env` files; only the `.env.example` files are tracked.

**Root `.env`** (read by Docker Compose)

| Variable              | Purpose                                             |
| --------------------- | --------------------------------------------------- |
| `MYSQL_ROOT_PASSWORD` | MySQL root password                                 |
| `MYSQL_DATABASE`      | Database name (default `idle_arcade`)               |
| `MYSQL_USER`          | App database user used by the backend container     |
| `MYSQL_PASSWORD`      | Password of that user                               |
| `MYSQL_PORT`          | Host port MySQL is published on (default `3306`)    |
| `BETTER_AUTH_SECRET`  | Secret for signing sessions, at least 32 characters |
| `APP_PORT`            | Host port of the app in Docker (default `8080`)     |

**`backend/.env`** (local development only)

| Variable             | Purpose                                                                            |
| -------------------- | ---------------------------------------------------------------------------------- |
| `NODE_ENV`           | `development` or `production`                                                      |
| `PORT`               | API port (default `3000`)                                                          |
| `DATABASE_URL`       | `mysql://…`; locally the root user, because `prisma migrate dev` needs a shadow DB |
| `BETTER_AUTH_SECRET` | Same as above                                                                      |
| `BETTER_AUTH_URL`    | Public origin the browser uses (`http://localhost:5173` locally)                   |

The backend validates its environment on startup and exits with a readable error if something is
missing. The frontend needs no environment variables; it always calls the relative path `/trpc`.

## Architecture

```
Browser ── /, /darts, … ──▶ Vite dev server (local) / nginx (Docker) ── static SPA
   │
   └── /trpc ──▶ (proxy) ──▶ Express ──▶ tRPC router ──▶ Better Auth / Prisma ──▶ MySQL
```

- **API:** all endpoints are tRPC procedures under `/trpc`, defined in `backend/src/routers/` and
  combined in `backend/src/trpc/router.ts`. Inputs are validated with Zod.
- **Type sharing:** the frontend imports the router type (`import type { AppRouter } from
"@idle-arcade/backend/router"`) and the Zod schemas in `backend/src/schemas/` directly from the
  backend workspace. That's why there's no separate `/shared` package. Keep `backend/src/schemas/`
  free of server-only imports.
- **Frontend routing:** file-based routes in `frontend/src/routes/`. `_game.tsx` is a pathless
  layout that guards all room routes (redirects to `/` without a session); `index.tsx` is the entry
  screen.

## Decisions

- **Authentication: Better Auth, wrapped in tRPC.** We use [Better Auth](https://www.better-auth.com)
  with its username plugin and Prisma adapter, but do not expose its own `/api/auth/*` endpoints.
  The procedures `auth.register`, `auth.login`, `auth.logout` and `auth.me` call `auth.api.*` on the
  server and forward Better Auth's `Set-Cookie` headers (httpOnly session cookie) onto the response.
  This keeps one API style and leaves password hashing and session handling to a maintained library.
  - Login is username + password only. Better Auth 1.7 still requires an email at sign-up, so each
    user gets an internal placeholder `<username>@users.idle-arcade.invalid` (reserved TLD). It's
    never shown and no email is ever sent.
  - Usernames: 3–20 characters, letters/numbers/underscore, unique case-insensitively. Passwords:
    8–128 characters. Every failed login returns the same "Invalid username or password".
  - Calling `auth.api.*` bypasses Better Auth's own rate limiter, so `auth.login` (10 per 5 min)
    and `auth.register` (5 per hour) are limited per client IP by `backend/src/trpc/rate-limit.ts`.
    The counters are in memory, which is fine for a single backend instance.
  - Use `protectedProcedure` for anything that needs a logged-in player.
- **Frontend routing and data:** TanStack Router (file-based, type-safe) with TanStack Query via
  `@trpc/tanstack-react-query`. Proposed in issue #21 for the frontend contributors to confirm.
- **Database:** MySQL 8.4 with Prisma 7 (driver adapter `@prisma/adapter-mariadb`).
- **npm install scripts:** npm 11 blocks dependency install scripts unless they are listed under
  `allowScripts` in the root `package.json` (currently Prisma and esbuild). After upgrading those
  packages, review and re-approve with `npm install-scripts approve <pkg>`.
- **Tests:** there is no automated test setup yet.

## How to…

**Add an API procedure:** add it to a router in `backend/src/routers/` (or create a new router and
register it in `backend/src/trpc/router.ts`). The frontend sees it immediately through
`trpc.<router>.<procedure>.queryOptions()` / `.mutationOptions()` from `frontend/src/lib/trpc.ts`.

**Add a room/page:** create a file in `frontend/src/routes/_game/` (e.g. `fishing.tsx`); the Vite
plugin regenerates `routeTree.gen.ts` automatically while `npm run dev` is running.

**Change the database:** edit `backend/prisma/schema.prisma`, then run `npm run db:migrate -- --name <change>`
and commit the generated migration.
