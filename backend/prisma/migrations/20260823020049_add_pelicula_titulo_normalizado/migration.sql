-- AlterTable
ALTER TABLE "Pelicula" ADD COLUMN     "tituloNormalizado" TEXT;

-- CreateIndex
CREATE INDEX "Pelicula_tituloNormalizado_idx" ON "Pelicula"("tituloNormalizado");
