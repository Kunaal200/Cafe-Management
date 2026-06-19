# syntax=docker/dockerfile:1

# ---------- Builder ----------
# Debian-based (glibc) so argon2 + Prisma engines work without extra fuss.
FROM node:22-slim AS builder
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
# openssl is required by Prisma; build tools cover any native module compile (argon2).
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Workspace manifests first for layer caching.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY shared/package.json shared/package.json
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json

# Install only the backend subgraph (backend + shared).
RUN pnpm install --filter @cafe/backend... --frozen-lockfile

# Build shared, generate Prisma client, build the API.
COPY shared ./shared
COPY backend ./backend
RUN pnpm --filter @cafe/shared build \
 && pnpm --filter @cafe/backend exec prisma generate \
 && pnpm --filter @cafe/backend build

# ---------- Runner ----------
FROM node:22-slim AS runner
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy the built workspace (node_modules carries the generated Prisma client).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend ./backend

EXPOSE 3000
# Apply pending migrations, then start the API.
CMD ["sh", "-c", "pnpm --filter @cafe/backend exec prisma migrate deploy && pnpm --filter @cafe/backend exec node dist/main.js"]
