-- Metadatos de película desde backend, no heurística frontend titulo.includes
-- Agrega genero a Pelicula y campos opcionales a Sugerencia para votación rica

-- Pelicula: genero
ALTER TABLE "Pelicula" ADD COLUMN "genero" TEXT;

-- Sugerencia: genero, duracionMin, sinopsis, posterUrl (todos nullable, se conocen cuando admin enriquece o vía Pelicula)
ALTER TABLE "Sugerencia" ADD COLUMN "genero" TEXT;
ALTER TABLE "Sugerencia" ADD COLUMN "duracionMin" INTEGER;
ALTER TABLE "Sugerencia" ADD COLUMN "sinopsis" TEXT;
ALTER TABLE "Sugerencia" ADD COLUMN "posterUrl" TEXT;
