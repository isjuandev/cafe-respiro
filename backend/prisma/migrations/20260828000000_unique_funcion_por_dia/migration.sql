-- Sala única: solo 1 función por día (única sala, 19:00 fijo)
-- Antes: UNIQUE (peliculaId, fechaHora) permitía 2 películas el mismo día.
-- Ahora: UNIQUE (fechaHora) — atómico ante race conditions.
-- Se mantiene índice por peliculaId para búsquedas.

-- Drop old composite unique if exists
DROP INDEX IF EXISTS "Funcion_peliculaId_fechaHora_key";

-- Create new unique on fechaHora (1 función por timestamp => 1 por día con HORA_FUNCION=19)
CREATE UNIQUE INDEX "Funcion_fechaHora_key" ON "Funcion"("fechaHora");

-- Defensa extra por día calendario (por si HORA_FUNCION llegara a variar):
-- Índice único sobre la fecha (sin hora) usando expresión. No genera constraint Prisma pero bloquea a nivel DB.
CREATE UNIQUE INDEX "Funcion_fechaSolo_key" ON "Funcion" (DATE("fechaHora"));
