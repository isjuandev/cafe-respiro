# syntax=docker/dockerfile:1.7
# Backend - NestJS + Prisma (optimizado para Coolify)
# Runner copia directo desde builder (sin pnpm deploy) para preservar engines de Prisma
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ---------- deps ----------
FROM base AS deps
WORKDIR /app
ENV NODE_ENV=development
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
# Instala únicamente las dependencias de backend (evita Next.js, React, Tailwind, etc.)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter backend...

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend ./backend
COPY frontend/package.json ./frontend/package.json
RUN pnpm --filter backend prisma:generate
RUN pnpm --filter backend build

# ---------- runner ----------
FROM node:20-alpine AS runner
RUN apk add --no-cache tzdata openssl wget tini
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=America/Bogota
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:/app/backend/node_modules/.bin:/app/node_modules/.bin:$PATH"

RUN addgroup -S nodejs -g 1001 && adduser -S nestjs -G nodejs -u 1001

# Copia directo con chown de nestjs:nodejs (sin duplicar capas con chown -R posterior)
COPY --from=builder --chown=nestjs:nodejs /app/backend/dist ./backend/dist
COPY --from=builder --chown=nestjs:nodejs /app/backend/prisma ./backend/prisma
COPY --from=builder --chown=nestjs:nodejs /app/backend/package.json ./backend/package.json
COPY --from=builder --chown=nestjs:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml

WORKDIR /app/backend

# Permisos de ejecución específicos para motores de Prisma (sin chown/chmod masivo que infla capas)
RUN chmod -R +x /app/backend/node_modules/.prisma /app/backend/node_modules/@prisma /app/node_modules/.prisma /app/node_modules/@prisma 2>/dev/null || true

USER nestjs

EXPOSE 3001
ENV PORT=3001
ENV HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
