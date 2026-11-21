# IDLE Arcade

## Tech stack

- **Monorepo:** npm workspaces (`frontend/`, `backend/`), Node.js 24, TypeScript
- **Frontend:** React, Vite, Tailwind CSS, TanStack Router, TanStack Query, react-i18next
- **Backend:** Express, tRPC, Zod, Better Auth
- **Database:** MySQL 9.7, Prisma
- **Tooling:** ESLint, Prettier, Docker Compose, nginx
- **CI/CD:** GitHub Actions, Docker Buildx, GHCR, Dokploy, markdownlint, Hadolint, actionlint, ShellCheck

## Commands

First-time setup: copy `.env.example` to `.env` and `backend/.env.example` to `backend/.env`, then
fill in the passwords and a `BETTER_AUTH_SECRET` of at least 32 characters.
For local development outside Docker, set `backend/.env`'s `DATABASE_URL` to match the
MySQL credentials, database name and published port in the root `.env`.
Start MySQL before running `npm run dev`. Both the dev backend and the Docker backend apply
existing Prisma migrations on startup. The automatic-player migration adds six ownership counts
to existing Darts room records, each initialized to zero.

| Command                                   | What it does                                                 |
| ----------------------------------------- | ------------------------------------------------------------ |
| `npm install`                             | Install dependencies and generate the Prisma client          |
| `docker compose up -d mysql`              | Start only MySQL, for local development                      |
| `npm run dev`                             | Start backend (:3000) and frontend (<http://localhost:5173>) |
| `docker compose up --build`               | Run the full stack in Docker (<http://localhost:8080>)       |
| `docker compose down -v`                  | Stop Docker and delete the database volume                   |
| `npm run build`                           | Build both workspaces                                        |
| `npm run typecheck`                       | Type-check both workspaces                                   |
| `npm run lint`                            | Run ESLint                                                   |
| `npm run format` / `npm run format:check` | Format with Prettier / only check formatting                 |
| `npm run db:migrate -- --name <change>`   | Create and apply a migration after editing the Prisma schema |
| `npm run db:generate`                     | Regenerate the Prisma client                                 |
| `npm run db:studio`                       | Open Prisma Studio                                           |

## Darts API

Swagger UI is available at [the local /docs endpoint](http://localhost:5173/docs) and
[the preview /docs endpoint](https://idle-arcade.craftingservices.de/docs).
Its OpenAPI document describes the native tRPC API under `/trpc`.

The Darts procedures are authenticated tRPC mutations.

- `darts.load` opens a new sync session and returns the room snapshot.
- `darts.state` takes the current session epoch and refreshes the authoritative room snapshot.
- `darts.sync` takes the epoch, sequence number, rules version, action batch, batch end time and client balance
  prediction. The batch can contain manual throws, upgrade purchases and automatic-player hires.

Room snapshots include the Beers amount, manual upgrade levels, owned counts by automatic-player
type, room time and sync metadata. The backend stores room progress and the shared Beers balance
for the account. The server validates the batch and calculates the authoritative balance.
