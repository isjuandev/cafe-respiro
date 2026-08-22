# Despliegue en Coolify — Café Respiro (Fase 1)

Guía paso a paso para desplegar el monorepo en Coolify usando los Dockerfiles optimizados para producción.

## Arquitectura en Coolify

No se despliega `docker-compose.yml` directo. Coolify crea **3 servicios separados** desde el mismo repo:

| Servicio | Dockerfile | Puerto | Healthcheck |
|----------|------------|--------|-------------|
| `postgres` | `postgres:16-alpine` oficial | 5432 | `pg_isready` |
| `backend` | `backend/Dockerfile` | 3001 | `GET /api/health` |
| `frontend` | `frontend/Dockerfile` | 3000 | `GET /api/health` (vía proxy) |

El `docker-compose.yml` es la referencia local; en Coolify se replica la config como variables y healthchecks por servicio.

## 1. Conectar el repo

1. Coolify → **Create Resource → Service → Git Repository** (o Application → Dockerfile)
2. URL: `git@github.com:isjuandev/cafe-respiro.git` (o HTTPS)
3. Branch: `main`
4. Build Pack: **Dockerfile**
5. Crear **3 aplicaciones** desde el mismo repo, cada una con su Dockerfile:
   - Backend: `Backend` → Dockerfile `backend/Dockerfile`, Port `3001`
   - Frontend: `Frontend` → Dockerfile `frontend/Dockerfile`, Port `3000`
   - Postgres: **Database → PostgreSQL 16** (no Dockerfile, imagen oficial)

Alternativa: usar **Docker Compose** deployment en Coolify (si tu instancia lo soporta) apuntando a `docker-compose.yml`, pero el método de 3 servicios es más explícito para dominios y envs.

## 2. Variables de entorno

### Postgres (servicio DB en Coolify)
```
POSTGRES_DB=caferespiro
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<genera uno seguro>
```
Coolify expone el host interno, ej. `postgres-...` o `caferespiro-postgres`. Anota el **Internal Host**.

### Backend (`backend/Dockerfile`)
```
DATABASE_URL=postgresql://postgres:<PASSWORD>@<INTERNAL_POSTGRES_HOST>:5432/caferespiro?schema=public
PORT=3001
FRONTEND_URL=https://<tu-dominio-frontend>   # ej. https://cafe-respiro.coolify.example.com
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<clave segura>
JWT_SECRET=<32+ chars aleatorios, ej. openssl rand -base64 32>
JWT_EXPIRES_IN=8h
```
> `FRONTEND_URL` se usa para CORS y para decidir cookie `Secure` (solo https → Secure). En Coolify con dominio https, pon la URL https real.

### Frontend (`frontend/Dockerfile`)
```
BACKEND_URL=http://<INTERNAL_BACKEND_HOST>:3001   # ej. http://caferespiro-backend:3001
PORT=3000
```
> **Importante:** `BACKEND_URL` se bakea en `next build` (ARG). Cambiarlo requiere **Rebuild** del frontend. No es runtime puro. Documentado en `frontend/Dockerfile:14`.

No uses `NEXT_PUBLIC_API_URL`. Todo va por rewrites `/api/*` (`frontend/next.config.mjs:7`).

## 3. Healthchecks y dominio

**Backend** ya tiene `HEALTHCHECK` en Dockerfile y compose:
```
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3001/api/health || exit 1
```
En Coolify: **Health Check → Path: `/api/health`**, Port `3001`, Interval `30s`.

**Frontend** también:
```
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/api/health || exit 1
```
En Coolify: `/api/health`, Port `3000`. Depende de backend healthy (ya en compose).

**Dominio:** Coolify → Frontend → **Domains** → `https://cafe-respiro.example.com` + `https://api.cafe-respiro.example.com` (si separas), o solo frontend y backend interno. Habilita **Let's Encrypt**.

## 4. Migraciones Prisma

Como parte del arranque del backend (idempotente):
```sh
npx prisma migrate deploy && node dist/src/main.js
```
Está en `backend/Dockerfile:33`. No requiere paso manual. En el primer deploy, crea las 2 migraciones:
- `20260822071141_init` (incluye índice parcial único para duplicados)
- `20260822091123_add_notification_log`

Si necesitas re-seed demo tras `down -v`:
```sh
docker compose exec backend npx prisma db seed
# o local: DATABASE_URL=... pnpm --filter backend exec prisma db seed
```
Crea 3 pelis + 3 funciones futuras + 1 sugerencia. En prod real, el seed es opcional.

## 5. Orden de deploy

1. Desplegar **Postgres** primero, esperar healthy.
2. Desplegar **Backend** (espera `migrate deploy` + `healthy`).
3. Desplegar **Frontend** (depends_on backend healthy en compose; en Coolify espera manual).

Ver logs: `docker compose logs backend | grep NOTIFY` para notificaciones stub.

## 6. Checklist Smoke Test post-deploy (correr a mano)

Copia y pega en terminal (cambia `BASE=https://tu-dominio`):

```bash
BASE=https://cafe-respiro.example.com
# o local: BASE=http://localhost:3000

# 1 Health
curl -s $BASE/api/health | grep ok && echo "✓ health"

# 2 Sugerir (201) y duplicado normalizado (200 duplicada:true)
curl -s -X POST $BASE/api/sugerencias -H "Content-Type: application/json" \
  -d '{"titulo":"Sprint4 QA","nombre":"QA","contacto":"qa@test.com"}' | grep -q "sugerencia" && echo "✓ sugerir"
curl -s -X POST $BASE/api/sugerencias -H "Content-Type: application/json" \
  -d '{"titulo":"  sprint4   QA  ","nombre":"QA2","contacto":"qa2@test.com"}' | grep -q "duplicada" && echo "✓ duplicado"

# 3 Votar (201) y duplicado (409) y ranking
ID=$(curl -s $BASE/api/sugerencias | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['sugerencias'][0]['id'])")
curl -s -X POST $BASE/api/sugerencias/$ID/votos -H "Content-Type: application/json" -d '{"nombre":"V1","contacto":"v1@test.com"}' | grep -q "voto" && echo "✓ voto"
curl -s -X POST $BASE/api/sugerencias/$ID/votos -H "Content-Type: application/json" -d '{"nombre":"V1","contacto":"v1@test.com"}' | grep -q "409" && echo "✓ voto duplicado 409"

# 4 Reservar (201) y overbooking (409) y FOR UPDATE
FUNCION=$(curl -s $BASE/api/funciones | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['funciones'][0]['id'])")
curl -s -X POST $BASE/api/funciones/$FUNCION/reservas -H "Content-Type: application/json" -d '{"nombre":"R","contacto":"r@test.com","cantidad":1}' | grep -q "reserva" && echo "✓ reserva"
curl -s -X POST $BASE/api/funciones/$FUNCION/reservas -H "Content-Type: application/json" -d '{"nombre":"R","contacto":"r@test.com","cantidad":1}' | grep -q "409" && echo "✓ reserva duplicado 409"

# 5 Admin login (cookie httpOnly)
rm -f /tmp/c.txt; curl -s -c /tmp/c.txt -X POST $BASE/api/admin/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | grep -q ok && echo "✓ login"
curl -s -b /tmp/c.txt $BASE/api/admin/me | grep -q authenticated && echo "✓ me"
# sin cookie debe dar 401
curl -s $BASE/api/admin/sugerencias | grep -q 401 && echo "✓ admin 401 sin cookie"

# 6 Admin estado → PROGRAMADA + notify
curl -s -b /tmp/c.txt -X PATCH $BASE/api/admin/sugerencias/$ID/estado -H "Content-Type: application/json" -d '{"estado":"PROGRAMADA"}' | grep -q PROGRAMADA && echo "✓ estado PROGRAMADA"

# 7 Admin crear función (futura) y ver reservas
FUTURE=$(date -u -v+14d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "+14 days" +"%Y-%m-%dT%H:%M:%SZ")
FUNCION_NEW=$(curl -s -b /tmp/c.txt -X POST $BASE/api/admin/funciones -H "Content-Type: application/json" -d "{\"sugerenciaId\":\"$ID\",\"fechaHora\":\"$FUTURE\",\"cupoTotal\":20}" | python3 -c "import json,sys; print(json.load(sys.stdin)['funcion']['id'])")
echo "✓ crear funcion $FUNCION_NEW"
curl -s -b /tmp/c.txt $BASE/api/admin/funciones/$FUNCION_NEW/reservas | grep -q reservas && echo "✓ reservas admin"

# 8 Bordes: fecha pasada y reserva pasada deben dar 400/409
PAST=$(date -u -v-1d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "-1 day" +"%Y-%m-%dT%H:%M:%SZ")
curl -s -b /tmp/c.txt -X POST $BASE/api/admin/funciones -H "Content-Type: application/json" -d "{\"sugerenciaId\":\"$ID\",\"fechaHora\":\"$PAST\",\"cupoTotal\":10}" | grep -q futura && echo "✓ past fechaHora 400"

# 9 Frontend vacíos/loading/error: abrir en browser
echo "Abrir $BASE/ (cartelera), $BASE/sugerencias (form + ranking), $BASE/admin/login y $BASE/admin (panel) y verificar skeletons y mensajes"
```

**Esperado:** todo `✓`, sin `500`, logs `NOTIFY` en `docker logs backend | grep NOTIFY`, y `NotificationLog` con 2 tipos.

## Notas Fase 1

- Seed demo solo si `down -v`; en prod la cartelera empieza vacía hasta que admin programe.
- `NotificationLog` es stub; reemplazar `NotificationsService` cuando elijas proveedor (Resend/SMTP/WhatsApp).
- Sin rate-limit ni lista de espera (Fase 1).
