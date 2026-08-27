CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Usuario_contacto_key" ON "Usuario"("contacto");
