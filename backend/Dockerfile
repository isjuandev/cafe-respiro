# Backend Dockerfile - NestJS + Prisma (multi-stage)
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY . .
RUN pnpm --filter backend prisma:generate
RUN pnpm --filter backend build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package.json ./backend/package.json
WORKDIR /app/backend
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
