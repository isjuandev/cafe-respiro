CREATE TABLE "CategoriaMenu" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CategoriaMenu_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItemMenu" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" INTEGER NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ItemMenu_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CategoriaMenu_orden_idx" ON "CategoriaMenu"("orden");
CREATE INDEX "ItemMenu_categoriaId_orden_idx" ON "ItemMenu"("categoriaId", "orden");
CREATE INDEX "ItemMenu_disponible_idx" ON "ItemMenu"("disponible");
ALTER TABLE "ItemMenu" ADD CONSTRAINT "ItemMenu_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaMenu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
