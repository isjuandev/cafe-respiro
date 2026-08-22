import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Café Respiro...');

  const peliculas = await Promise.all([
    prisma.pelicula.upsert({
      where: { id: 'seed-pelicula-1' },
      update: {},
      create: {
        id: 'seed-pelicula-1',
        titulo: 'El viaje de Chihiro',
        director: 'Hayao Miyazaki',
        anio: 2001,
        duracionMin: 125,
        sinopsis: 'Chihiro entra en un mundo de espíritus y debe encontrar la forma de liberar a sus padres.',
        posterUrl: null,
      },
    }),
    prisma.pelicula.upsert({
      where: { id: 'seed-pelicula-2' },
      update: {},
      create: {
        id: 'seed-pelicula-2',
        titulo: 'Parásitos',
        director: 'Bong Joon-ho',
        anio: 2019,
        duracionMin: 132,
        sinopsis: 'Una familia sin recursos se infiltra en la vida de una familia adinerada.',
        posterUrl: null,
      },
    }),
    prisma.pelicula.upsert({
      where: { id: 'seed-pelicula-3' },
      update: {},
      create: {
        id: 'seed-pelicula-3',
        titulo: 'Retrato de una mujer en llamas',
        director: 'Céline Sciamma',
        anio: 2019,
        duracionMin: 121,
        sinopsis: 'En la Bretaña del siglo XVIII, una pintora y su musa desarrollan una intensa relación.',
        posterUrl: null,
      },
    }),
  ]);

  // Funciones futuras (cartelera)
  const now = new Date();
  const addDays = (d: number, h: number, m: number) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + d);
    dt.setHours(h, m, 0, 0);
    return dt;
  };

  await prisma.funcion.upsert({
    where: { id: 'seed-funcion-1' },
    update: { fechaHora: addDays(2, 19, 30), cupoTotal: 40 },
    create: {
      id: 'seed-funcion-1',
      peliculaId: peliculas[0].id,
      fechaHora: addDays(2, 19, 30),
      cupoTotal: 40,
    },
  });

  await prisma.funcion.upsert({
    where: { id: 'seed-funcion-2' },
    update: { fechaHora: addDays(5, 20, 0), cupoTotal: 35 },
    create: {
      id: 'seed-funcion-2',
      peliculaId: peliculas[1].id,
      fechaHora: addDays(5, 20, 0),
      cupoTotal: 35,
    },
  });

  await prisma.funcion.upsert({
    where: { id: 'seed-funcion-3' },
    update: { fechaHora: addDays(7, 18, 0), cupoTotal: 30 },
    create: {
      id: 'seed-funcion-3',
      peliculaId: peliculas[2].id,
      fechaHora: addDays(7, 18, 0),
      cupoTotal: 30,
    },
  });

  // Sugerencias de ejemplo
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ');

  await prisma.sugerencia.upsert({
    where: { id: 'seed-sugerencia-1' },
    update: {},
    create: {
      id: 'seed-sugerencia-1',
      titulo: 'Perfect Days',
      tituloNormalizado: normalize('Perfect Days'),
      comentario: 'De Wim Wenders, ideal para el ciclo de cine contemplativo.',
      nombreSolicitante: 'Ana',
      contacto: 'ana@example.com',
      estado: 'PENDIENTE',
    },
  });

  console.log('Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
