-- Máquina de estados consistente: PENDIENTE -> GANADORA -> PROGRAMADA -> DESCARTADA
-- 1. Nuevo valor enum (recreación transaccional segura, evita ALTER TYPE ADD VALUE en transacción)
CREATE TYPE "SugerenciaEstado_new" AS ENUM ('PENDIENTE', 'GANADORA', 'PROGRAMADA', 'DESCARTADA');
ALTER TABLE "Sugerencia" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Sugerencia" ALTER COLUMN "estado" TYPE "SugerenciaEstado_new" USING ("estado"::text::"SugerenciaEstado_new");
ALTER TABLE "Sugerencia" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';
DROP TYPE "SugerenciaEstado";
ALTER TYPE "SugerenciaEstado_new" RENAME TO "SugerenciaEstado";

-- 2. Compatibilidad datos existentes: normalizar PROGRAMADA huérfana antes de crear constraints
-- Si existe PROGRAMADA sin peliculaId o sin función futura, retroceder a GANADORA
UPDATE "Sugerencia" AS s
SET estado = 'GANADORA'
WHERE s.estado = 'PROGRAMADA'
  AND (
    s.peliculaId IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM "Funcion" f
      WHERE f."peliculaId" = s.peliculaId
        AND f."fechaHora" > NOW()
    )
  );

-- 3. Actualizar índice parcial de duplicados activos para incluir GANADORA
DROP INDEX IF EXISTS "Sugerencia_tituloNormalizado_activo_key";
CREATE UNIQUE INDEX "Sugerencia_tituloNormalizado_activo_key" ON "Sugerencia"("tituloNormalizado") WHERE "estado" IN ('PENDIENTE', 'GANADORA', 'PROGRAMADA');

-- 4. Invariante DB: PROGRAMADA debe tener peliculaId
ALTER TABLE "Sugerencia" ADD CONSTRAINT "Sugerencia_programada_requiere_pelicula" CHECK (estado != 'PROGRAMADA' OR peliculaId IS NOT NULL);
