# syntax=docker/dockerfile:1.7
# Frontend - Next.js 15 (optimizado para Coolify)
# - output: standalone activado en next.config.mjs
# - BACKEND_URL como ARG (bakea rewrites en build; requiere rebuild si cambia)
# - Runner minimal sin pnpm, solo node + standalone
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
# BACKEND_URL se inyecta en build (Next rewrites se bakea). Para Coolify, cambiar BACKEND_URL requiere rebuild del frontend.
ARG BACKEND_URL=http://backend:3001
ENV BACKEND_URL=$BACKEND_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
# Solo copia frontend + workspace (NO copia backend/src) para que cambios en backend no invaliden cache del frontend
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY frontend ./frontend
# Stub para workspace resolution (no copia backend/src)
COPY backend/package.json ./backend/package.json
# Build solo frontend (más rápido y cacheable que `pnpm -r build`)
RUN pnpm --filter frontend build

# Runner: imagen mínima con standalone
FROM node:20-alpine AS runner
RUN apk add --no-cache wget tini
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# BACKEND_URL en runtime solo afecta a server-side fetches directos; rewrites ya está bakeado (requiere rebuild si cambia)
ENV BACKEND_URL=http://backend:3001

RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -G nodejs -u 1001

# Standalone output: copia server + deps mínimas
# Next standalone genera: frontend/.next/standalone (con server.js) y mantiene static/public separados
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/next.config.mjs ./frontend/next.config.mjs
# Para runtime, Next standalone espera estar en /app/frontend, pero al copiar a /app queda en /app/frontend/.next ?
# Estructura standalone: /app/frontend/server.js + /app/frontend/.next/static
# Ajustamos WORKDIR para que server.js se ejecute correctamente
WORKDIR /app/frontend

EXPOSE 3000

# Healthcheck no depende del backend (evita timeout si backend tarda). Backend tiene su propio healthcheck en :3001/api/health
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

USER nextjs

ENTRYPOINT ["tini", "--"]
# standalone trae server.js en /app/frontend/server.js tras COPY
CMD ["node", "server.js"]
