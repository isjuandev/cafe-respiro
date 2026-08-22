-- CreateTable
CREATE TABLE "Pelicula" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "director" TEXT,
    "anio" INTEGER,
    "duracionMin" INTEGER,
    "sinopsis" TEXT,
    "posterUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pelicula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sugerencia" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "director" TEXT,
    "anio" INTEGER,
    "comentario" TEXT,
    "nombreSolicitante" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "peliculaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sugerencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voto" (
    "id" TEXT NOT NULL,
    "sugerenciaId" TEXT NOT NULL,
    "nombreVotante" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Voto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcion" (
    "id" TEXT NOT NULL,
    "peliculaId" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "cupoTotal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "funcionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pelicula_titulo_idx" ON "Pelicula"("titulo");

-- CreateIndex
CREATE INDEX "Sugerencia_peliculaId_idx" ON "Sugerencia"("peliculaId");

-- CreateIndex
CREATE INDEX "Voto_sugerenciaId_idx" ON "Voto"("sugerenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "Voto_sugerenciaId_contacto_key" ON "Voto"("sugerenciaId", "contacto");

-- CreateIndex
CREATE INDEX "Funcion_peliculaId_idx" ON "Funcion"("peliculaId");

-- CreateIndex
CREATE INDEX "Funcion_fechaHora_idx" ON "Funcion"("fechaHora");

-- CreateIndex
CREATE UNIQUE INDEX "Funcion_peliculaId_fechaHora_key" ON "Funcion"("peliculaId", "fechaHora");

-- CreateIndex
CREATE INDEX "Reserva_funcionId_idx" ON "Reserva"("funcionId");

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_funcionId_contacto_key" ON "Reserva"("funcionId", "contacto");

-- AddForeignKey
ALTER TABLE "Sugerencia" ADD CONSTRAINT "Sugerencia_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voto" ADD CONSTRAINT "Voto_sugerenciaId_fkey" FOREIGN KEY ("sugerenciaId") REFERENCES "Sugerencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcion" ADD CONSTRAINT "Funcion_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES "Funcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
