# Café Respiro — Cine-Café

MVP donde clientes sugieren películas, votan y reservan cupo para funciones. **Sprint 0: solo infraestructura, sin features.**

Stack: **Monorepo pnpm** · **NestJS + Prisma + PostgreSQL** · **Next.js (App Router) + Tailwind + shadcn/ui** · **Docker Compose** · Listo para **Coolify**.

---

## Requisitos

- Node 20+ y pnpm 10+
- Docker + Docker Compose v2
- OrbStack / Docker Desktop

## Levantar todo con Docker (recomendado)

Un solo comando levanta `postgres` → `backend` (con migraciones) → `frontend`:

```bash
cp .env.example .env        # ya viene con defaults locales
docker compose up --build
```

Servicios:

| Servicio | URL | Proxy |
|----------|-----|-------|
| Frontend | http://localhost:3000 | — |
| Backend  | http://localhost:3001/api (directo) | http://localhost:3000/api (vía proxy Next.js) |
| Health   | http://localhost:3000/api/health (proxy) o http://localhost:3001/api/health (directo) | — |
| Postgres | localhost:5432 (user: postgres / pass: postgres / db: caferespiro) | `docker compose ps` |

Logs:

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
```

Bajar:

```bash
docker compose down        # conserva datos
docker compose down -v     # borra volumen de postgres
```

## Comunicación Frontend ↔ Backend (Proxy rewrites)

El frontend **no usa `NEXT_PUBLIC_API_URL`**. Todas las llamadas son a rutas relativas `/api/*` y Next.js las proxea al backend vía `rewrites` en `frontend/next.config.mjs:1`:

```js
// next.config.mjs
async rewrites() {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
  return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
}
```

- **Local sin Docker:** `BACKEND_URL` por defecto `http://localhost:3001`.
- **Docker Compose:** `BACKEND_URL=http://backend:3001` (nombre del servicio como hostname interno) — ver `docker-compose.yml:1`.
- **Coolify:** inyectar `BACKEND_URL` con la URL interna del servicio backend. Sin rebuild del frontend al cambiar la URL.

El navegador solo ve `http://localhost:3000/api/health`, el proxy lo resuelve en server-side.

## Desarrollo sin Docker (opcional)

```bash
pnpm install
# terminal 1: requiere postgres corriendo (docker compose up postgres -d)
pnpm --filter backend prisma:migrate dev
pnpm --filter backend dev   # http://localhost:3001/api

# terminal 2
pnpm --filter frontend dev  # http://localhost:3000 (proxy /api -> localhost:3001)
```

Variables: `backend/.env` → `DATABASE_URL`, frontend usa `BACKEND_URL` (ver `.env.example` en la raíz y `frontend/.env.example`).

## Estructura

```
.
├── docker-compose.yml
├── pnpm-workspace.yaml
├── .env.example
├── backend/
│   ├── src/
│   │   ├── main.ts              # prefijo /api, CORS, ValidationPipe
│   │   ├── app.module.ts
│   │   ├── app.controller.ts    # GET /api/health
│   │   ├── prisma/              # PrismaService (global)
│   │   ├── peliculas/
│   │   ├── sugerencias/
│   │   ├── votos/
│   │   ├── funciones/
│   │   └── reservas/            # módulos vacíos listos para Sprint 1
│   ├── prisma/
│   │   ├── schema.prisma        # Pelicula, Sugerencia, Voto, Funcion, Reserva
│   │   └── migrations/          # 20260822070148_init
│   └── Dockerfile               # multi-stage, prisma migrate deploy + nest build
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx             # landing Sprint 0 (usa /api/health vía proxy)
    │   └── globals.css          # tailwind + shadcn css variables
    ├── components/ui/button.tsx # shadcn/ui
    ├── lib/utils.ts             # cn() + apiFetch (usa /api relativo)
    ├── next.config.mjs          # rewrites /api -> BACKEND_URL
    └── Dockerfile               # multi-stage, pnpm build + pnpm start
```

## Modelo de datos (Prisma)

- **Pelicula** (catálogo curado): `titulo*`, `director`, `anio`, `duracionMin`, `sinopsis`, `posterUrl`
- **Sugerencia** (Sprint 0 sin `estado`; moderación se agrega en su feature): `titulo*`, `director`, `anio`, `comentario`, `nombreSolicitante*`, `contacto*` (normalizado lower+trim), `peliculaId?`
- **Voto**: `sugerenciaId*`, `nombreVotante*`, `contacto*` — `@@unique([sugerenciaId, contacto])`
- **Funcion**: `peliculaId*`, `fechaHora*` (`DateTime` único: fecha+hora en una sola columna, fácil de ordenar/comparar), `cupoTotal*` — `@@unique([peliculaId, fechaHora])`
- **Reserva**: `funcionId*`, `nombre*`, `contacto*`, `cantidad` (default 1) — `@@unique([funcionId, contacto])`

Identificación sin cuenta: `contacto` (email o teléfono) normalizado. Anti-duplicado por constraint DB → `409 Conflict`.

## API (convención Sprint 1)

Prefijo global `/api` en NestJS:

```
GET    /api/health
GET    /api/peliculas         POST /api/peliculas
GET    /api/sugerencias       POST /api/sugerencias
POST   /api/sugerencias/:id/votos
GET    /api/funciones         POST /api/funciones
GET    /api/funciones/:id     GET /api/funciones/:id/reservas
POST   /api/funciones/:id/reservas
```

Frontend consume solo vía `/api` relativo (proxy), nunca directo a DB.

## Variables de entorno

**Local (`docker-compose`):**

```env
POSTGRES_DB=caferespiro
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/caferespiro?schema=public
BACKEND_PORT=3001
FRONTEND_PORT=3000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://backend:3001
```

`DATABASE_URL` dentro de compose usa host `postgres` (nombre del servicio). En local sin Docker usar `localhost`.

**Coolify:** configurar las mismas vars en la UI por servicio (no subir `.env`). `BACKEND_URL` se inyecta en el servicio frontend (ej. `http://caferespiro-backend:3001`) y `DATABASE_URL` en backend con el host interno de Postgres. No requiere `NEXT_PUBLIC_API_URL`.

## Docker

- `backend/Dockerfile`: base `node:20-alpine` + `pnpm`, deps cacheado, `prisma generate`, `nest build`, runner ejecuta `npx prisma migrate deploy && node dist/main.js` con healthcheck `wget /api/health`.
- `frontend/Dockerfile`: base `node:20-alpine` + `pnpm`, deps cacheado, `next build`, runner `pnpm start` (port 3000). `BACKEND_URL` como `ARG`/`ENV` en runtime para rewrites.
- `docker-compose.yml`: `postgres:16-alpine` con healthcheck `pg_isready`, `backend` depends_on postgres healthy, `frontend` depends_on backend healthy (con `BACKEND_URL=http://backend:3001`). Volúmenes: `postgres_data`.

## Coolify

Este repo está listo para deploy en Coolify a partir de los Dockerfiles. Crear 3 servicios: Postgres, Backend (Dockerfile `backend/Dockerfile`), Frontend (Dockerfile `frontend/Dockerfile`). Mapear env vars y exponer puertos 3001/3000. El proxy `/api` evita rebuild del frontend al cambiar la URL del backend.

## Scripts raíz

```bash
pnpm docker:up      # docker compose up --build
pnpm docker:down    # docker compose down
pnpm db:generate    # prisma generate
pnpm db:migrate     # prisma migrate dev
```
