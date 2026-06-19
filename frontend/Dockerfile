# syntax=docker/dockerfile:1

# ---------- Builder ----------
# Build context is the repo root so we can access the pnpm workspace + @cafe/shared.
FROM node:22-alpine AS builder
ENV CI=true
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app

# Copy workspace manifests first for better layer caching.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY shared/package.json shared/package.json
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json

# Install only the frontend subgraph (frontend + shared), skipping backend's
# native dependencies (argon2/prisma) entirely.
RUN pnpm install --filter @cafe/frontend... --frozen-lockfile

# Copy the source the frontend needs and build shared, then the app.
COPY shared ./shared
COPY frontend ./frontend
RUN pnpm --filter @cafe/shared build \
 && pnpm --filter @cafe/frontend build

# ---------- Runner ----------
FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nextjs

# Next.js standalone output mirrors the monorepo layout under /app.
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

USER nextjs
EXPOSE 3000
CMD ["node", "frontend/server.js"]
