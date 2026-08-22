# Café Respiro — Cine-Café

MVP donde clientes sugieren películas, votan y reservan cupo para funciones. **Sprint 1: cartelera pública + sugerencia de películas** (Sprint 0: infra completa).

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
# en otra terminal, seed de cartelera (3 pelis + 3 funciones + 1 sugerencia)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/caferespiro?schema=public pnpm --filter backend exec prisma db seed
# o dentro del container:
docker compose exec backend npx prisma db seed
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
│   │   ├── common/utils/normalize.ts # normalizeTitulo / normalizeContacto
│   │   ├── sugerencias/         # GET /api/sugerencias, POST /api/sugerencias (duplicado con índice parcial)
│   │   ├── funciones/           # GET /api/funciones (cartelera con cuposDisponibles)
│   │   ├── peliculas/           # reservado
│   │   ├── votos/               # Sprint 2
│   │   └── reservas/            # Sprint 2
│   ├── prisma/
│   │   ├── schema.prisma        # Pelicula, Sugerencia (con estado + tituloNormalizado), Voto, Funcion, Reserva
│   │   ├── migrations/          # 20260822071141_init (con índice parcial único)
│   │   └── seed.ts              # 3 pelis + 3 funciones + 1 sugerencia
│   └── Dockerfile               # multi-stage, prisma migrate deploy + node dist/src/main.js
└── frontend/
    ├── app/
    │   ├── layout.tsx           # header nav Cartelera | Sugerencias
    │   ├── page.tsx             # / cartelera (funciones programadas)
    │   ├── sugerencias/page.tsx # /sugerencias lista + formulario
    │   └── globals.css          # tailwind + shadcn css variables
    ├── components/ui/button.tsx # shadcn/ui
    ├── lib/utils.ts             # cn() + apiFetch (usa /api relativo)
    ├── next.config.mjs          # rewrites /api -> BACKEND_URL
    └── Dockerfile               # multi-stage, pnpm build + pnpm start
```

## Modelo de datos (Prisma)

- **Pelicula** (catálogo curado): `titulo*`, `director`, `anio`, `duracionMin`, `sinopsis`, `posterUrl`
- **Sugerencia** (Sprint 1 con `estado` + anti-carrera): `titulo*`, `tituloNormalizado*` (determinista: NFD lower trim sin puntuación colapso espacios), `comentario?`, `nombreSolicitante*`, `contacto*` (normalizado lower), `estado` (`PENDIENTE|PROGRAMADA|DESCARTADA` default `PENDIENTE`), `peliculaId?`
  - Índice parcial único: `CREATE UNIQUE INDEX ON "Sugerencia"("tituloNormalizado") WHERE estado IN ('PENDIENTE','PROGRAMADA')` — `DESCARTADA` permite re-sugerir. Race garantizado por PG (P2002 → 200 duplicada).
- **Voto**: `sugerenciaId*`, `nombreVotante*`, `contacto*` — `@@unique([sugerenciaId, contacto])`
- **Funcion**: `peliculaId*`, `fechaHora*` (`DateTime` único: fecha+hora en una sola columna), `cupoTotal*` — `@@unique([peliculaId, fechaHora])`
- **Reserva**: `funcionId*`, `nombre*`, `contacto*`, `cantidad` (default 1) — `@@unique([funcionId, contacto])`

Identificación sin cuenta: `contacto` normalizado. Anti-duplicado de sugerencias por índice parcial, votos/reservas por constraint unique.

## API Sprint 1 (implementado)

Prefijo global `/api` en NestJS. No incluye votación/reservas (Sprint 2) ni admin (Sprint 3).

```
GET    /api/health
GET    /api/sugerencias              # solo PENDIENTE, order createdAt desc, incluye _count.votos
POST   /api/sugerencias              # body { titulo, comentario?, nombre, contacto } → 201 { duplicada:false } o 200 { duplicada:true, sugerencia: existente } + 400 validation
GET    /api/funciones                # solo fechaHora >= now(), order asc, incluye pelicula + cuposDisponibles/cuposOcupados
```

Validación: `CreateSugerenciaDto` con `class-validator` (titulo 2-120, comentario 0-500, nombre 2-60, contacto 2-100) + `ValidationPipe` global + validación cliente en formulario.

Frontend consume solo vía `/api` relativo (proxy), nunca directo a DB. Estados de carga/error/empty visibles.

## Frontend Sprint 1

- `/` → Cartelera: fetch `GET /api/funciones`, loading skeleton, error con retry, empty → CTA a `/sugerencias`, grid con `fechaHora` localizada, cupos disponibles, botón reservar deshabilitado (Sprint 2).
- `/sugerencias` → Lista `GET /api/sugerencias` + formulario `POST /api/sugerencias` con validación cliente, mensajes de éxito/duplicada/error, recarga lista tras crear.
- `layout.tsx` con header `Cartelera | Sugerencias` (rutas separadas para compartir links).

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

- `backend/Dockerfile`: base `node:20-alpine` + `pnpm`, deps cacheado, `prisma generate`, `nest build`, runner ejecuta `npx prisma migrate deploy && node dist/src/main.js` con healthcheck `wget /api/health`.
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
pnpm db:seed        # prisma db seed (cartelera demo)
```
