# syntax=docker/dockerfile:1.7
# Backend - NestJS + Prisma (optimizado para Coolify)
# - Cache de pnpm con --mount=type=cache
# - Multi-stage con pruned prod deps via `pnpm deploy`
# - Runner minimal Alpine + non-root + healthcheck
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ---------- deps: instala todas las deps (cacheable) ----------
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- builder: genera Prisma Client + build Nest ----------
# Solo copia backend + workspace (NO copia frontend/src) para que cambios en frontend no invaliden cache del backend
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend ./backend
# Stub para workspace resolution (no copia frontend/src)
COPY frontend/package.json ./frontend/package.json
RUN pnpm --filter backend prisma:generate
RUN pnpm --filter backend build

# ---------- pruner: deps solo de produccion para backend ----------
FROM base AS pruner
WORKDIR /app
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/backend/package.json ./backend/package.json
# pnpm deploy necesita al menos un package.json de frontend para resolver workspace, pero no copia su codigo
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
# genera carpeta pruned con solo prod deps del backend
RUN pnpm --filter backend deploy --prod /prod/backend --legacy && \
    rm -rf /prod/backend/dist && rm -rf /prod/backend/prisma && \
    cp -r /app/backend/dist /prod/backend/dist && \
    cp -r /app/backend/prisma /prod/backend/prisma && \
    cp /app/backend/package.json /prod/backend/package.json && \
    cp /app/pnpm-lock.yaml /prod/backend/pnpm-lock.yaml 2>/dev/null || true

# ---------- runner: imagen final minimal ----------
FROM node:20-alpine AS runner
RUN apk add --no-cache tzdata openssl wget tini
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=America/Bogota
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Usuario no-root (requerido por Coolify/docker hardening)
RUN addgroup -S nodejs -g 1001 && adduser -S nestjs -G nodejs -u 1001

# Copia deps pruned + build (deploy ya incluye node_modules prod + dist + prisma copiados)
COPY --from=pruner --chown=nestjs:nodejs /prod/backend ./backend
WORKDIR /app/backend

# Prisma CLI para `migrate deploy` en runtime (no esta en prod deps, version del lockfile)
RUN npm install -g prisma@6.19.3 --ignore-scripts || pnpm add -g prisma@6.19.3

EXPOSE 3001
ENV PORT=3001
ENV HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

USER nestjs

# tini para manejo correcto de señales (SIGTERM de Coolify)
ENTRYPOINT ["tini", "--"]
# Migraciones idempotentes + arranque
CMD ["sh", "-c", "prisma migrate deploy && node dist/main.js"]
