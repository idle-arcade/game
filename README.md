# IDLE Arcade

## Tech stack

- **Monorepo:** npm workspaces (`frontend/`, `backend/`), Node.js 24, TypeScript
- **Frontend:** React, Vite, Tailwind CSS, TanStack Router, TanStack Query, react-i18next
- **Backend:** Express, tRPC, Zod, Better Auth
- **Database:** MySQL 8.4, Prisma
- **Tooling:** ESLint, Prettier, Docker Compose, nginx

## Commands

First-time setup: copy `.env.example` to `.env` and `backend/.env.example` to `backend/.env`, then
fill in the passwords and a `BETTER_AUTH_SECRET` of at least 32 characters.

| Command                                   | What it does                                                 |
| ----------------------------------------- | ------------------------------------------------------------ |
| `npm install`                             | Install dependencies and generate the Prisma client          |
| `docker compose up -d mysql`              | Start only MySQL, for local development                      |
| `npm run dev`                             | Start backend (:3000) and frontend (http://localhost:5173)   |
| `docker compose up --build`               | Run the full stack in Docker (http://localhost:8080)         |
| `docker compose down -v`                  | Stop Docker and delete the database volume                   |
| `npm run build`                           | Build both workspaces                                        |
| `npm run typecheck`                       | Type-check both workspaces                                   |
| `npm run lint`                            | Run ESLint                                                   |
| `npm run format` / `npm run format:check` | Format with Prettier / only check formatting                 |
| `npm run db:migrate -- --name <change>`   | Create and apply a migration after editing the Prisma schema |
| `npm run db:generate`                     | Regenerate the Prisma client                                 |
| `npm run db:studio`                       | Open Prisma Studio                                           |
