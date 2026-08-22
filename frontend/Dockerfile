# Frontend Dockerfile - Next.js con proxy rewrites (multi-stage)
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
# BACKEND_URL se inyecta en build (Next rewrites se bakea). Para Coolify, cambiar BACKEND_URL requiere rebuild.
# No hardcodear valor real aquí; se pasa como --build-arg en CI/Coolify.
ARG BACKEND_URL=http://backend:3001
ENV BACKEND_URL=$BACKEND_URL
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY . .
RUN pnpm --filter frontend build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/next.config.mjs ./frontend/next.config.mjs
WORKDIR /app/frontend
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# BACKEND_URL en runtime solo afecta a server-side fetches; rewrites ya está bakeado, requiere rebuild si cambia (documentado)
ENV BACKEND_URL=http://backend:3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["pnpm", "start"]
