# Cafe & Restaurant Management System

Multi-tenant SaaS for cafes and restaurants. API-first, mobile-ready.

> Planning docs live in [`planning/`](./planning). Start with [`PROJECT_OVERVIEW.md`](./planning/PROJECT_OVERVIEW.md)
> and [`SOURCE_OF_TRUTH.md`](./planning/SOURCE_OF_TRUTH.md).

## Monorepo layout

```
backend/    NestJS API (all business logic, multi-tenant)
frontend/   React app (dashboard / POS / KDS / public)
shared/     Shared TypeScript types & Zod schemas (used by both)
planning/   Project planning documents
```

## Prerequisites
- Node.js >= 20
- pnpm (>= 9) — `npm install -g pnpm`
- Docker (for local PostgreSQL + Redis)

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env        # PowerShell: Copy-Item .env.example .env

# 3. Start PostgreSQL + Redis
pnpm db:up

# 4. Run database migrations (after backend is set up)
pnpm --filter @cafe/backend prisma:migrate

# 5. Start the backend API
pnpm dev:backend
```

## Useful scripts
| Script | Description |
|--------|-------------|
| `pnpm db:up` / `pnpm db:down` | Start/stop local Postgres + Redis |
| `pnpm dev:backend` | Run the NestJS API in watch mode |
| `pnpm dev:frontend` | Run the frontend app |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Test all packages |

## Tech stack
- **Backend:** NestJS, TypeScript, Prisma, PostgreSQL, Redis, JWT auth
- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui
- **Multi-tenancy:** shared database with `tenant_id` + Postgres Row-Level Security
