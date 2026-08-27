const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const normalizeTitulo = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');

const daysFromNow = (days, hour, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
};

async function main() {
  console.log('Limpiando datos anteriores...');

  // Seed reproducible: elimina también datos creados manualmente en el entorno local.
  await prisma.notificationLog.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.voto.deleteMany();
  await prisma.funcion.deleteMany();
  await prisma.votacion.deleteMany();
  await prisma.sugerencia.deleteMany();
  await prisma.itemMenu.deleteMany();
  await prisma.categoriaMenu.deleteMany();
  await prisma.pelicula.deleteMany();
  await prisma.usuario.deleteMany();

  await prisma.usuario.create({
    data: {
      id: 'seed-usuario-1',
      nombre: 'Valentina Rojas',
      contacto: 'valentina@example.com',
      passwordHash: await bcrypt.hash('CafeRespiro123!', 10),
    },
  });

  console.log('Creando catálogo de películas...');
  const peliculasData = [
    {
      id: 'seed-pelicula-1', titulo: 'El viaje de Chihiro', director: 'Hayao Miyazaki', anio: 2001, genero: 'Animación', duracionMin: 125,
      sinopsis: 'Chihiro entra en un mundo de espíritus y debe encontrar la forma de liberar a sus padres.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    },
    {
      id: 'seed-pelicula-2', titulo: 'Parásitos', director: 'Bong Joon-ho', anio: 2019, genero: 'Drama', duracionMin: 132,
      sinopsis: 'Una familia sin recursos se infiltra en la vida de una familia adinerada.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    },
    {
      id: 'seed-pelicula-3', titulo: 'Retrato de una mujer en llamas', director: 'Céline Sciamma', anio: 2019, genero: 'Drama', duracionMin: 121,
      sinopsis: 'Una pintora y su modelo desarrollan una intensa relación en la Bretaña del siglo XVIII.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/2LquGwEhbg3soxSCs9VNyfVxH2O.jpg',
    },
    {
      id: 'seed-pelicula-4', titulo: 'Perfect Days', director: 'Wim Wenders', anio: 2023, genero: 'Drama', duracionMin: 123,
      sinopsis: 'Hirayama encuentra belleza y serenidad en su rutina cotidiana en Tokio.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/8zw8ILj3pXyL2d5b9v0g6q7b1nM.jpg',
    },
    {
      id: 'seed-pelicula-5', titulo: 'La peor persona del mundo', director: 'Joachim Trier', anio: 2021, genero: 'Drama', duracionMin: 128,
      sinopsis: 'Durante cuatro años, Julie navega por su vida amorosa y sus decisiones profesionales.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/1X9J8kD4Yx7hV5sN2rL0pQ6mB3C.jpg',
    },
    {
      id: 'seed-pelicula-6', titulo: 'El espíritu de la colmena', director: 'Víctor Erice', anio: 1973, genero: 'Drama', duracionMin: 98,
      sinopsis: 'Una niña de la España rural queda fascinada por una película y sus misterios.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/4w1c0JmM4kz7V5t0p2q8s6nR3dL.jpg',
    },
  ];
  const peliculas = await Promise.all(
    peliculasData.map((pelicula) =>
      prisma.pelicula.create({ data: { ...pelicula, tituloNormalizado: normalizeTitulo(pelicula.titulo) } }),
    ),
  );
  const pelicula = (id) => peliculas.find((item) => item.id === id);

  console.log('Creando menú...');
  const cafe = await prisma.categoriaMenu.create({ data: { id: 'seed-categoria-cafe', nombre: 'Café de especialidad', orden: 1 } });
  const bebidas = await prisma.categoriaMenu.create({ data: { id: 'seed-categoria-bebidas', nombre: 'Bebidas frías', orden: 2 } });
  const dulces = await prisma.categoriaMenu.create({ data: { id: 'seed-categoria-dulces', nombre: 'Dulce y salado', orden: 3 } });
  await prisma.itemMenu.createMany({
    data: [
      { id: 'seed-item-espresso', categoriaId: cafe.id, nombre: 'Espresso doble', descripcion: 'Café de especialidad, tueste medio.', precio: 2800, orden: 1 },
      { id: 'seed-item-flat-white', categoriaId: cafe.id, nombre: 'Flat white', descripcion: 'Doble espresso con leche texturizada.', precio: 4200, orden: 2 },
      { id: 'seed-item-cold-brew', categoriaId: bebidas.id, nombre: 'Cold brew', descripcion: 'Extracción en frío durante 18 horas.', precio: 4500, orden: 1 },
      { id: 'seed-item-limonada', categoriaId: bebidas.id, nombre: 'Limonada de hierbabuena', descripcion: 'Limón fresco, hierbabuena y hielo.', precio: 3500, orden: 2 },
      { id: 'seed-item-cheesecake', categoriaId: dulces.id, nombre: 'Cheesecake de frutos rojos', descripcion: 'Porción casera con coulis de frutos rojos.', precio: 5500, orden: 1 },
      { id: 'seed-item-sandwich', categoriaId: dulces.id, nombre: 'Sándwich de focaccia', descripcion: 'Vegetales asados, mozzarella y pesto.', precio: 6800, orden: 2 },
      { id: 'seed-item-agotado', categoriaId: dulces.id, nombre: 'Tarta de temporada', descripcion: 'Producto temporal no disponible.', precio: 5000, disponible: false, orden: 3 },
    ],
  });

  console.log('Creando sugerencias y votos...');
  // Estados: PENDIENTE (votable), GANADORA (ganó votación, pendiente de función), PROGRAMADA (pelicula+funcion futura), DESCARTADA
  // Metadatos provienen del backend (genero, posterUrl, sinopsis, duracionMin) — null si desconocido, frontend usa fallback
  const sugerencias = await Promise.all([
    prisma.sugerencia.create({ data: { id: 'seed-sugerencia-1', titulo: 'La princesa Mononoke', tituloNormalizado: normalizeTitulo('La princesa Mononoke'), director: 'Hayao Miyazaki', anio: 1997, genero: 'Animación', duracionMin: 134, sinopsis: 'Un joven guerrero se ve envuelto en la lucha entre los dioses del bosque y los humanos.', posterUrl: null, comentario: 'Para continuar el ciclo de animación japonesa.', nombreSolicitante: 'Ana Torres', contacto: 'ana@example.com', estado: 'PENDIENTE' } }),
    prisma.sugerencia.create({ data: { id: 'seed-sugerencia-2', titulo: 'Moonlight', tituloNormalizado: normalizeTitulo('Moonlight'), director: 'Barry Jenkins', anio: 2016, genero: 'Drama', duracionMin: 111, sinopsis: 'Un joven afroamericano lidia con su identidad y sexualidad mientras crece en Miami.', posterUrl: null, comentario: 'Una historia íntima sobre identidad y pertenencia.', nombreSolicitante: 'Mateo Ruiz', contacto: 'mateo@example.com', estado: 'PENDIENTE' } }),
    prisma.sugerencia.create({ data: { id: 'seed-sugerencia-3', titulo: 'Los delincuentes', tituloNormalizado: normalizeTitulo('Los delincuentes'), director: 'Rodrigo Moreno', anio: 2023, genero: 'Drama', duracionMin: 189, sinopsis: 'Dos empleados bancarios planean un robo para liberarse de la rutina.', posterUrl: null, comentario: 'Cine argentino contemporáneo para descubrir.', nombreSolicitante: 'Lucía Gómez', contacto: 'lucia@example.com', estado: 'PENDIENTE' } }),
    // PROGRAMADA válida: ya vinculada a película y con función futura (seed-funcion-4)
    prisma.sugerencia.create({ data: { id: 'seed-sugerencia-4', titulo: 'Perfect Days', tituloNormalizado: normalizeTitulo('Perfect Days'), director: 'Wim Wenders', anio: 2023, genero: 'Drama', duracionMin: 123, sinopsis: 'Hirayama encuentra belleza y serenidad en su rutina cotidiana en Tokio.', posterUrl: 'https://image.tmdb.org/t/p/w500/8zw8ILj3pXyL2d5b9v0g6q7b1nM.jpg', comentario: 'Ya está seleccionada para la próxima función.', nombreSolicitante: 'Diego Martín', contacto: 'diego@example.com', estado: 'PROGRAMADA', peliculaId: pelicula('seed-pelicula-4').id } }),
    prisma.sugerencia.create({ data: { id: 'seed-sugerencia-5', titulo: 'Stalker', tituloNormalizado: normalizeTitulo('Stalker'), director: 'Andréi Tarkovski', anio: 1979, genero: null, duracionMin: null, sinopsis: null, posterUrl: null, comentario: 'La duración supera el formato actual del café.', nombreSolicitante: 'Sofía León', contacto: 'sofia@example.com', estado: 'DESCARTADA' } }),
  ]);
  const sugerencia = (id) => sugerencias.find((item) => item.id === id);
  await prisma.voto.createMany({
    data: [
      { id: 'seed-voto-1', sugerenciaId: sugerencia('seed-sugerencia-1').id, nombreVotante: 'Carlos Pérez', contacto: 'carlos@example.com' },
      { id: 'seed-voto-2', sugerenciaId: sugerencia('seed-sugerencia-1').id, nombreVotante: 'María López', contacto: 'maria@example.com' },
      { id: 'seed-voto-3', sugerenciaId: sugerencia('seed-sugerencia-1').id, nombreVotante: 'Nora Vidal', contacto: 'nora@example.com' },
      { id: 'seed-voto-4', sugerenciaId: sugerencia('seed-sugerencia-2').id, nombreVotante: 'Pablo Díaz', contacto: 'pablo@example.com' },
      { id: 'seed-voto-5', sugerenciaId: sugerencia('seed-sugerencia-2').id, nombreVotante: 'Eva Castro', contacto: 'eva@example.com' },
      { id: 'seed-voto-6', sugerenciaId: sugerencia('seed-sugerencia-3').id, nombreVotante: 'Raúl Silva', contacto: 'raul@example.com' },
    ],
  });

  const rondaActiva = await prisma.votacion.create({
    data: {
      id: 'seed-votacion-activa',
      iniciaAt: new Date(),
      cierraAt: daysFromNow(2, 18),
      sugerencias: { connect: [{ id: 'seed-sugerencia-1' }, { id: 'seed-sugerencia-2' }, { id: 'seed-sugerencia-3' }] },
    },
  });
  await prisma.votacion.create({
    data: {
      id: 'seed-votacion-cerrada',
      iniciaAt: daysFromNow(-12, 18),
      cierraAt: daysFromNow(-10, 18),
      estado: 'CERRADA',
      ganadoraId: 'seed-sugerencia-4',
      sugerencias: { connect: [{ id: 'seed-sugerencia-4' }] },
    },
  });

  console.log('Creando funciones y reservas...');
  const funciones = [
    { id: 'seed-funcion-1', peliculaId: 'seed-pelicula-1', fechaHora: daysFromNow(2, 19), cupoTotal: 15 },
    { id: 'seed-funcion-2', peliculaId: 'seed-pelicula-2', fechaHora: daysFromNow(4, 19), cupoTotal: 15 },
    { id: 'seed-funcion-3', peliculaId: 'seed-pelicula-3', fechaHora: daysFromNow(6, 19), cupoTotal: 12 },
    { id: 'seed-funcion-4', peliculaId: 'seed-pelicula-4', fechaHora: daysFromNow(8, 19), cupoTotal: 10 },
    { id: 'seed-funcion-5', peliculaId: 'seed-pelicula-5', fechaHora: daysFromNow(10, 19), cupoTotal: 8 },
    { id: 'seed-funcion-pasada', peliculaId: 'seed-pelicula-6', fechaHora: daysFromNow(-3, 19), cupoTotal: 15 },
  ];
  await prisma.funcion.createMany({ data: funciones });
  await prisma.reserva.createMany({
    data: [
      { id: 'seed-reserva-1', funcionId: 'seed-funcion-1', nombre: 'Valentina Rojas', contacto: 'valentina@example.com', cantidad: 2 },
      { id: 'seed-reserva-2', funcionId: 'seed-funcion-1', nombre: 'Jorge Navarro', contacto: 'jorge@example.com', cantidad: 3 },
      { id: 'seed-reserva-3', funcionId: 'seed-funcion-2', nombre: 'Camila Ortiz', contacto: 'camila@example.com', cantidad: 5 },
      { id: 'seed-reserva-4', funcionId: 'seed-funcion-2', nombre: 'Andrés Vega', contacto: 'andres@example.com', cantidad: 4 },
      { id: 'seed-reserva-5', funcionId: 'seed-funcion-3', nombre: 'Elena Cruz', contacto: 'elena@example.com', cantidad: 1 },
      { id: 'seed-reserva-6', funcionId: 'seed-funcion-5', nombre: 'Equipo Café', contacto: 'equipo@example.com', cantidad: 8 },
    ],
  });

  await prisma.notificationLog.createMany({
    data: [
      { id: 'seed-notificacion-1', tipo: 'SUGERENCIA_PROGRAMADA', destinatario: 'diego@example.com', payload: { sugerenciaId: 'seed-sugerencia-4', titulo: 'Perfect Days' } },
      { id: 'seed-notificacion-2', tipo: 'RESERVA_CONFIRMADA', destinatario: 'valentina@example.com', payload: { reservaId: 'seed-reserva-1', funcionId: 'seed-funcion-1', pelicula: 'El viaje de Chihiro', cantidad: 2 } },
      { id: 'seed-notificacion-3', tipo: 'RESERVA_CONFIRMADA', destinatario: 'camila@example.com', payload: { reservaId: 'seed-reserva-3', funcionId: 'seed-funcion-2', pelicula: 'Parásitos', cantidad: 10 } },
    ],
  });

  console.log(`Seed completo: 1 usuario cliente, 6 películas, 3 categorías, 7 ítems, 5 sugerencias, 6 votos, 2 rondas (${rondaActiva.id}), 6 funciones y 6 reservas.`);
  console.log('Cuenta cliente de prueba: valentina@example.com / CafeRespiro123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
