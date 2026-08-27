CREATE TYPE "VotacionEstado" AS ENUM ('ACTIVA', 'CERRADA');

CREATE TABLE "Votacion" (
    "id" TEXT NOT NULL,
    "iniciaAt" TIMESTAMP(3) NOT NULL,
    "cierraAt" TIMESTAMP(3) NOT NULL,
    "estado" "VotacionEstado" NOT NULL DEFAULT 'ACTIVA',
    "ganadoraId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Votacion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Sugerencia" ADD COLUMN "votacionId" TEXT;

CREATE INDEX "Votacion_estado_idx" ON "Votacion"("estado");
CREATE INDEX "Votacion_cierraAt_idx" ON "Votacion"("cierraAt");
CREATE UNIQUE INDEX "Votacion_ganadoraId_key" ON "Votacion"("ganadoraId");
CREATE UNIQUE INDEX "Votacion_una_activa_idx" ON "Votacion"("estado") WHERE "estado" = 'ACTIVA';
CREATE INDEX "Sugerencia_votacionId_idx" ON "Sugerencia"("votacionId");

ALTER TABLE "Votacion" ADD CONSTRAINT "Votacion_ganadoraId_fkey"
  FOREIGN KEY ("ganadoraId") REFERENCES "Sugerencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sugerencia" ADD CONSTRAINT "Sugerencia_votacionId_fkey"
  FOREIGN KEY ("votacionId") REFERENCES "Votacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
