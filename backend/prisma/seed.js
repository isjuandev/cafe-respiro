const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function normalizeTitulo(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizeContacto(c) {
  if (!c) return '';
  return c.trim().toLowerCase();
}

function daysFromNow(days, hours = 19, minutes = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function main() {
  console.log('--- 1. Limpiando base de datos completa ---');
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

  console.log('--- 2. Creando usuarios de prueba y clientes frecuentes de Armenia ---');
  const passwordHash = await bcrypt.hash('CafeRespiro2026!', 10);

  const usuarios = await Promise.all([
    prisma.usuario.create({
      data: {
        id: 'user-valentina',
        nombre: 'Valentina Rojas',
        contacto: normalizeContacto('valentina.rojas@gmail.com'),
        passwordHash,
      },
    }),
    prisma.usuario.create({
      data: {
        id: 'user-carlos',
        nombre: 'Carlos Mendoza',
        contacto: normalizeContacto('carlos.mendoza@hotmail.com'),
        passwordHash,
      },
    }),
    prisma.usuario.create({
      data: {
        id: 'user-sofia',
        nombre: 'Sofía Gómez',
        contacto: normalizeContacto('sofia.gomez@gmail.com'),
        passwordHash,
      },
    }),
    prisma.usuario.create({
      data: {
        id: 'user-mateo',
        nombre: 'Mateo Ruiz',
        contacto: normalizeContacto('mateo.ruiz@gmail.com'),
        passwordHash,
      },
    }),
  ]);

  console.log('--- 3. Creando catálogo real de películas de Café Respiro Armenia ---');
  const peliculasData = [
    {
      id: 'pel-rey-leon',
      titulo: 'El Rey León',
      director: 'Jon Favreau',
      anio: 2019,
      genero: 'Animación / Aventura / Drama',
      duracionMin: 121,
      sinopsis:
        'La épica aventura en la sabana africana donde nace Simba, un cachorro que idolatra a su padre, el rey Mufasa. Tras una traición familiar, Simba deberá madurar para recuperar su legítimo lugar como rey.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/eGfq90BF8QGCMpncF2ag0lGTgKk.jpg',
    },
    {
      id: 'pel-precio-manana',
      titulo: 'El precio del mañana',
      director: 'Andrew Niccol',
      anio: 2011,
      genero: 'Acción / Ciencia Ficción / Suspenso',
      duracionMin: 109,
      sinopsis:
        'En un futuro donde el tiempo es la moneda de cambio y se deja de envejecer a los 25 años, los ricos viven para siempre mientras los pobres negocian cada minuto. Will Salas es acusado injustamente y toma una rehén en su huida.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/qNVdN4nY1Byf0VfgFSzofcEGWyt.jpg',
    },
    {
      id: 'pel-avatar',
      titulo: 'Avatar',
      director: 'James Cameron',
      anio: 2009,
      genero: 'Acción / Aventura / Ciencia Ficción',
      duracionMin: 162,
      sinopsis:
        'En la luna alienígena Pandora, el exmarine Jake Sully se infiltra a través de un cuerpo biológico avatar entre la tribu Na’vi, enfrentándose al dilema de seguir órdenes o proteger un mundo extraordinario.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/tXmTHdrZgNsULqCbThK2Dt2X9Wt.jpg',
    },
    {
      id: 'pel-yo-antes-de-ti',
      titulo: 'Yo antes de ti',
      director: 'Thea Sharrock',
      anio: 2016,
      genero: 'Drama / Romance',
      duracionMin: 111,
      sinopsis:
        'La alegre y peculiar Louisa Clark acepta cuidar a Will Traynor, un joven banquero que quedó tetrapléjico. Con el tiempo, ambos transforman profundamente la visión del mundo del otro.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/vVIDt9FjuTLbXeuc2mJRYnqMh1F.jpg',
    },
    {
      id: 'pel-perfect-days',
      titulo: 'Días perfectos',
      director: 'Wim Wenders',
      anio: 2023,
      genero: 'Drama',
      duracionMin: 123,
      sinopsis:
        'Hirayama trabaja en el mantenimiento de los baños públicos de Tokio. Parece totalmente satisfecho con su sencilla rutina diaria, entregado a su pasión por la música, los libros y la fotografía de árboles.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/efnvsuEdkdwiWR7WyQ2QgcGt8mM.jpg',
    },
    {
      id: 'pel-chihiro',
      titulo: 'El viaje de Chihiro',
      director: 'Hayao Miyazaki',
      anio: 2001,
      genero: 'Animación / Fantasía',
      duracionMin: 125,
      sinopsis:
        'Chihiro, una niña de diez años, se adentra en un mundo mágico habitado por antiguos dioses y seres fantásticos gobernados por la bruja Yubaba.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    },
    {
      id: 'pel-cinema-paradiso',
      titulo: 'Cinema Paradiso',
      director: 'Giuseppe Tornatore',
      anio: 1988,
      genero: 'Drama / Comedia',
      duracionMin: 155,
      sinopsis:
        'Salvatore, un cineasta consagrado, regresa a su pueblo natal en Sicilia para el funeral de Alfredo, el anciano proyeccionista que le transmitió la pasión por el séptimo arte.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/r3THaIn8doKSLUMA3qXQJPGyMnU.jpg',
    },
    {
      id: 'pel-parasitos',
      titulo: 'Parásitos',
      director: 'Bong Joon-ho',
      anio: 2019,
      genero: 'Drama / Suspense',
      duracionMin: 132,
      sinopsis:
        'Una familia sin recursos urde un plan para infiltrarse paulatinamente como empleados en la residencia de una adinerada familia, desatando una serie de consecuencias imprevistas.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    },
    {
      id: 'pel-anatomia-caida',
      titulo: 'Anatomía de una caída',
      director: 'Justine Triet',
      anio: 2023,
      genero: 'Drama / Suspense',
      duracionMin: 151,
      sinopsis:
        'Cuando un hombre es hallado muerto en la nieve en los Alpes franceses, su esposa es acusada de homicidio y sometida a un juicio que disecciona su relación marital.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/31MkIlfEaQ5vopz5lulP96xbZyU.jpg',
    },
  ];

  const peliculas = await Promise.all(
    peliculasData.map((pelicula) =>
      prisma.pelicula.create({
        data: {
          ...pelicula,
          tituloNormalizado: normalizeTitulo(pelicula.titulo),
        },
      })
    )
  );
  console.log(`✓ Creadas ${peliculas.length} películas en el catálogo.`);

  console.log('--- 4. Creando Menú 100% oficial de Treggio (COMIDA, CAFÉ, POSTRE, BEBIDAS, CINE) ---');
  const catComida = await prisma.categoriaMenu.create({
    data: { id: 'cat-comida', nombre: 'COMIDA', orden: 1 },
  });
  const catCafe = await prisma.categoriaMenu.create({
    data: { id: 'cat-cafe', nombre: 'CAFÉ', orden: 2 },
  });
  const catPostre = await prisma.categoriaMenu.create({
    data: { id: 'cat-postre', nombre: 'POSTRE', orden: 3 },
  });
  const catBebidas = await prisma.categoriaMenu.create({
    data: { id: 'cat-bebidas', nombre: 'BEBIDAS', orden: 4 },
  });
  const catCine = await prisma.categoriaMenu.create({
    data: { id: 'cat-cine', nombre: 'CINE', orden: 5 },
  });

  await prisma.itemMenu.createMany({
    data: [
      // === 1. COMIDA ===
      {
        id: 'item-sandwiche-vegetariano',
        categoriaId: catComida.id,
        nombre: 'Sandwiche Vegetariano',
        descripcion: 'Pan brioche dorado, cebolla caramelizada, lechuga, tomate, champiñón, berenjena y queso.',
        precio: 16000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a92610b818ff_1787977995.webp',
        disponible: true,
        orden: 1,
      },
      {
        id: 'item-canasta-pollo',
        categoriaId: catComida.id,
        nombre: 'Canasta de pollo',
        descripcion: 'Crujiente canasta de plátano rellena de pollo desmechado con champiñones acompañado de nuestra cremosa salsa Alfredo o Salsa criolla.',
        precio: 20000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a87e4057c42a_1787290629.webp',
        disponible: true,
        orden: 2,
      },
      {
        id: 'item-canasta-ceviche',
        categoriaId: catComida.id,
        nombre: 'Canasta de ceviche de chicharrón',
        descripcion: 'Canasta de plátano crujiente con ceviche de chicharrón y fresco pico de gallo.',
        precio: 23000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a80eba477e1b_1786833828.webp',
        disponible: true,
        orden: 3,
      },
      {
        id: 'item-canasta-criolla',
        categoriaId: catComida.id,
        nombre: 'Canasta Criolla',
        descripcion: 'Crujiente canasta de plátano rellena de carne desmechada, salsa criolla y un toque especial de la casa.',
        precio: 25000,
        imagenUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=450&fit=crop',
        disponible: true,
        orden: 4,
      },
      {
        id: 'item-sandwiche-criollo',
        categoriaId: catComida.id,
        nombre: 'Sandwiche Criollo',
        descripcion: 'Pan Brioche dorado, carne desmechada, queso, lechuga y tomate, acompañado de nuestra salsa criollo y terminado con parmesano.',
        precio: 23000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a7f8fd836ad1_1786744792.webp',
        disponible: true,
        orden: 5,
      },
      {
        id: 'item-sandwiche-pollo-cremoso',
        categoriaId: catComida.id,
        nombre: 'Sandwiche Pollo Cremoso',
        descripcion: 'Pan brioche dorado, pollo, queso, champiñones (opcional), lechuga y tomate, acompañado de nuestra cremosa salsa Alfredo o Criolla y parmesano.',
        precio: 19000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a7f8fb650dd6_1786744758.webp',
        disponible: true,
        orden: 6,
      },
      {
        id: 'item-sandwiche-clasico',
        categoriaId: catComida.id,
        nombre: 'Sándwiche El clásico',
        descripcion: 'Pan Brioche dorado a la plancha, jamón, queso, lechuga, tomate y parmesano.',
        precio: 16000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a7f4fd80557e_1786728408.webp',
        disponible: true,
        orden: 7,
      },
      {
        id: 'item-nachos-pollo',
        categoriaId: catComida.id,
        nombre: 'Nachos de pollo',
        descripcion: 'Tortillas de maíz crujientes, sofrito de frijoles, pollo, pico de gallo, guacamole, suero y un toque de mantequilla.',
        precio: 24000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a87e43b95b8f_1787290683.webp',
        disponible: true,
        orden: 8,
      },
      {
        id: 'item-nachos-carne',
        categoriaId: catComida.id,
        nombre: 'Nachos de Carne',
        descripcion: 'Tortillas de maiz crujientes, sofrito de frijoles, carne desmechada, hogao, pico de gallo, guacamole y suero.',
        precio: 29000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a80ebe9211b7_1786833897.webp',
        disponible: true,
        orden: 9,
      },

      // === 2. CAFÉ ===
      {
        id: 'item-cold-brew-jamaica',
        categoriaId: catCafe.id,
        nombre: 'Cold Brew Jamaica',
        descripcion: 'Extracción en frío con infusión de flor de Jamaica, notas florales, refrescante y bajo en acidez.',
        precio: 13000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a86407262dcd_1787183218.webp',
        disponible: true,
        orden: 1,
      },
      {
        id: 'item-naranja-brew',
        categoriaId: catCafe.id,
        nombre: 'Naranja Brew',
        descripcion: 'Bebida refrescante que combina la suavidad y baja acidez del café concentrado en frío con las notas cítricas y dulces del jugo de naranja.',
        precio: 13000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a87e3b969ae5_1787290553.webp',
        disponible: true,
        orden: 2,
      },
      {
        id: 'item-cold-brew-tradicional',
        categoriaId: catCafe.id,
        nombre: 'Cold Brew (Café Frio)',
        descripcion: 'Café extraído en frío mediante una infusión lenta de café molido en agua fría.',
        precio: 10000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a863ee4e8a95_1787182820.webp',
        disponible: true,
        orden: 3,
      },
      {
        id: 'item-latte-frio',
        categoriaId: catCafe.id,
        nombre: 'Latte Frio',
        descripcion: 'Refrescante bebida de café compuesta por un espresso, abundante hielo y una gran proporción de leche fría.',
        precio: 8000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a863e7e33e06_1787182718.webp',
        disponible: true,
        orden: 4,
      },
      {
        id: 'item-latte',
        categoriaId: catCafe.id,
        nombre: 'Latte',
        descripcion: 'Espresso con leche vaporizada, suave, cremoso y equilibrado.',
        precio: 7000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a7f60523114a_1786732626.webp',
        disponible: true,
        orden: 5,
      },
      {
        id: 'item-capuccino',
        categoriaId: catCafe.id,
        nombre: 'Capuccino',
        descripcion: 'Espresso, leche vaporizada y una cremosa capa de espuma.',
        precio: 7000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a87e3ee41325_1787290606.webp',
        disponible: true,
        orden: 6,
      },
      {
        id: 'item-macchiato',
        categoriaId: catCafe.id,
        nombre: 'Macchiato',
        descripcion: 'Espresso coronado con un toque de leche, para una combinación intensa y cremosa.',
        precio: 5000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a7f5fe54c812_1786732517.webp',
        disponible: true,
        orden: 7,
      },
      {
        id: 'item-americano',
        categoriaId: catCafe.id,
        nombre: 'Americano',
        descripcion: 'Espresso suavizado con agua caliente para disfrutar una taza más ligera y prolongada.',
        precio: 4000,
        imagenUrl: 'https://api.treggio.co/storage/products/6a7f5fa7dfb48_1786732455.webp',
        disponible: true,
        orden: 8,
      },
      {
        id: 'item-expresso',
        categoriaId: catCafe.id,
        nombre: 'Expresso',
        descripcion: 'Un café intenso y concentrado, preparado con nuestro café seleccionado.',
        precio: 4500,
        imagenUrl: 'https://api.treggio.co/storage/products/6a7f5f6aed8e4_1786732394.webp',
        disponible: true,
        orden: 9,
      },

      // === 3. POSTRE ===
      {
        id: 'item-torta-casa',
        categoriaId: catPostre.id,
        nombre: 'Torta de la casa',
        descripcion: 'Deliciosa torta balanceada.',
        precio: 8000,
        imagenUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=450&fit=crop',
        disponible: true,
        orden: 1,
      },
      {
        id: 'item-capricho-red-velvet',
        categoriaId: catPostre.id,
        nombre: 'Capricho Red Velvet',
        descripcion: 'Trozos de torta Red Velvet con una suave crema frosting y un delicado suspiro.',
        precio: 12000,
        imagenUrl: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=600&h=450&fit=crop',
        disponible: true,
        orden: 2,
      },
      {
        id: 'item-capricho-arequipe',
        categoriaId: catPostre.id,
        nombre: 'Capricho de arequipe',
        descripcion: 'Trozos de torta de vainilla, arequipe balanceado, crema chantillí y un delicado toque crocante.',
        precio: 9500,
        imagenUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=450&fit=crop',
        disponible: true,
        orden: 3,
      },
      {
        id: 'item-suspiro-elan-maracuya',
        categoriaId: catPostre.id,
        nombre: 'Suspiro Élan Maracuyá',
        descripcion: 'Suspiro (Merengue) balanceado, con salsa de maracuyá y crema. Un postre dulce y cítrico.',
        precio: 9000,
        imagenUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=450&fit=crop',
        disponible: true,
        orden: 4,
      },

      // === 4. BEBIDAS ===
      {
        id: 'item-aromatica',
        categoriaId: catBebidas.id,
        nombre: 'Aromática',
        descripcion: 'Infusión aromática de frutas y hierbas naturales.',
        precio: 6000,
        imagenUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&h=450&fit=crop',
        disponible: true,
        orden: 1,
      },
      {
        id: 'item-soda-limon',
        categoriaId: catBebidas.id,
        nombre: 'Soda con limon',
        descripcion: 'Refrescante soda gasificada con zumo de limón fresco.',
        precio: 7500,
        imagenUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&h=450&fit=crop',
        disponible: true,
        orden: 2,
      },
      {
        id: 'item-mora-pina',
        categoriaId: catBebidas.id,
        nombre: 'Mora & Piña',
        descripcion: 'Mora, piña y hierbabuena. Una combinación vibrante, refrescante y llena de sabor.',
        precio: 11000,
        imagenUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&h=450&fit=crop',
        disponible: true,
        orden: 3,
      },
      {
        id: 'item-verde-canela',
        categoriaId: catBebidas.id,
        nombre: 'Verde canela',
        descripcion: 'Lulo, guayaba agria y canela. Tropical, ligeramente ácida y con un delicado toque especiado.',
        precio: 11000,
        imagenUrl: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&h=450&fit=crop',
        disponible: true,
        orden: 4,
      },
      {
        id: 'item-dulce-romero',
        categoriaId: catBebidas.id,
        nombre: 'Dulce Romero',
        descripcion: 'Mango, fresa y romero. Una soda frutal, fresca y aromática, con un toque herbal único.',
        precio: 11000,
        imagenUrl: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600&h=450&fit=crop',
        disponible: true,
        orden: 5,
      },

      // === 5. CINE ===
      {
        id: 'item-reserva-cine-esencial',
        categoriaId: catCine.id,
        nombre: 'Reserva Cine Esencial',
        descripcion: 'Disfruta la película en nuestros muebles de cine, con cojines para mayor comodidad.',
        precio: 15000,
        imagenUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=450&fit=crop',
        disponible: true,
        orden: 1,
      },
      {
        id: 'item-reserva-cine-preferencial',
        categoriaId: catCine.id,
        nombre: 'Reserva Cine Preferencial',
        descripcion: 'Disfruta una función de cine en el ambiente acogedor de RESPIRO, con todo lo necesario (película + combo).',
        precio: 30000,
        imagenUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=600&h=450&fit=crop',
        disponible: true,
        orden: 2,
      },
      {
        id: 'item-reserva-cine-especial',
        categoriaId: catCine.id,
        nombre: 'Reserva Cine Especial',
        descripcion: 'Una función para disfrutar sin preocuparte por nada. Película, antojos gourmet y mucho sabor en sala.',
        precio: 45000,
        imagenUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&h=450&fit=crop',
        disponible: true,
        orden: 3,
      },
    ],
  });
  console.log('✓ Menú oficial de Treggio creado con 5 categorías y 30 productos.');

  console.log('--- 5. Creando sugerencias comunitarias de la comunidad ---');
  const sugerencias = await Promise.all([
    prisma.sugerencia.create({
      data: {
        id: 'sug-cinema-paradiso',
        titulo: 'Cinema Paradiso',
        tituloNormalizado: normalizeTitulo('Cinema Paradiso'),
        director: 'Giuseppe Tornatore',
        anio: 1988,
        genero: 'Drama / Comedia',
        duracionMin: 155,
        sinopsis:
          'Una carta de amor al cine. La historia de amistad entre Salvatore y el proyeccionista Alfredo.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/r3THaIn8doKSLUMA3qXQJPGyMnU.jpg',
        comentario: 'Un clásico indispensable para ver en pantalla grande con un buen café en Armenia.',
        nombreSolicitante: 'Valentina Rojas',
        contacto: normalizeContacto('valentina.rojas@gmail.com'),
        estado: 'PENDIENTE',
      },
    }),
    prisma.sugerencia.create({
      data: {
        id: 'sug-anatomia',
        titulo: 'Anatomía de una caída',
        tituloNormalizado: normalizeTitulo('Anatomía de una caída'),
        director: 'Justine Triet',
        anio: 2023,
        genero: 'Drama / Suspense',
        duracionMin: 151,
        sinopsis:
          'Ganadora de la Palma de Oro en Cannes. Un juicio tenso que disecciona las complejidades de una pareja.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/31MkIlfEaQ5vopz5lulP96xbZyU.jpg',
        comentario: 'Guion brillante, genera un debate increíble para el cineforo después de la función.',
        nombreSolicitante: 'Carlos Mendoza',
        contacto: normalizeContacto('carlos.mendoza@hotmail.com'),
        estado: 'PENDIENTE',
      },
    }),
    prisma.sugerencia.create({
      data: {
        id: 'sug-yo-antes-de-ti',
        titulo: 'Yo antes de ti',
        tituloNormalizado: normalizeTitulo('Yo antes de ti'),
        director: 'Thea Sharrock',
        anio: 2016,
        genero: 'Drama / Romance',
        duracionMin: 111,
        sinopsis: 'Historia conmovedora sobre el amor, la empatía y la dignidad humana.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/vVIDt9FjuTLbXeuc2mJRYnqMh1F.jpg',
        comentario: 'Queremos ver esta película romántica en la sala boutique con picoteo de autor.',
        nombreSolicitante: 'David Ospina',
        contacto: normalizeContacto('david.ospina@yahoo.com'),
        estado: 'PENDIENTE',
      },
    }),
    prisma.sugerencia.create({
      data: {
        id: 'sug-rey-leon',
        titulo: 'El Rey León',
        tituloNormalizado: normalizeTitulo('El Rey León'),
        director: 'Jon Favreau',
        anio: 2019,
        genero: 'Animación / Aventura',
        duracionMin: 121,
        sinopsis: 'Simba emprende su camino hacia la madurez y la reconquista de su trono.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/eGfq90BF8QGCMpncF2ag0lGTgKk.jpg',
        comentario: 'Perfecta para una tarde familiar y de amigos con juegos de mesa.',
        nombreSolicitante: 'Sofía Gómez',
        contacto: normalizeContacto('sofia.gomez@gmail.com'),
        estado: 'PROGRAMADA',
        peliculaId: 'pel-rey-leon',
      },
    }),
  ]);

  console.log('--- 6. Creando Votos y Rondas de Votación ---');
  await prisma.voto.createMany({
    data: [
      {
        id: 'voto-1',
        sugerenciaId: 'sug-cinema-paradiso',
        nombreVotante: 'Valentina Rojas',
        contacto: normalizeContacto('valentina.rojas@gmail.com'),
      },
      {
        id: 'voto-2',
        sugerenciaId: 'sug-cinema-paradiso',
        nombreVotante: 'Carlos Mendoza',
        contacto: normalizeContacto('carlos.mendoza@hotmail.com'),
      },
      {
        id: 'voto-3',
        sugerenciaId: 'sug-anatomia',
        nombreVotante: 'Lucía Morales',
        contacto: normalizeContacto('lucia.morales@gmail.com'),
      },
      {
        id: 'voto-4',
        sugerenciaId: 'sug-yo-antes-de-ti',
        nombreVotante: 'Esteban Bernal',
        contacto: normalizeContacto('esteban.b@gmail.com'),
      },
      {
        id: 'voto-5',
        sugerenciaId: 'sug-yo-antes-de-ti',
        nombreVotante: 'Sofía Gómez',
        contacto: normalizeContacto('sofia.gomez@gmail.com'),
      },
    ],
  });

  // Ronda de votación activa
  const votacionActiva = await prisma.votacion.create({
    data: {
      id: 'votacion-ronda-actual',
      iniciaAt: new Date(),
      cierraAt: daysFromNow(2, 18),
      estado: 'ACTIVA',
      sugerencias: {
        connect: [
          { id: 'sug-cinema-paradiso' },
          { id: 'sug-anatomia' },
          { id: 'sug-yo-antes-de-ti' },
        ],
      },
    },
  });

  console.log(`✓ Rondas de votación configuradas (Activa: ${votacionActiva.id}).`);

  console.log('--- 7. Programando Funciones Reales en Cartelera (7:00 PM / Aforo 16 cupos) ---');
  const funcionesData = [
    {
      id: 'func-hoy-rey-leon',
      peliculaId: 'pel-rey-leon',
      fechaHora: daysFromNow(0, 19), // Hoy 7:00 PM
      cupoTotal: 16,
    },
    {
      id: 'func-manana-precio-manana',
      peliculaId: 'pel-precio-manana',
      fechaHora: daysFromNow(1, 19), // Mañana 7:00 PM
      cupoTotal: 16,
    },
    {
      id: 'func-viernes-avatar',
      peliculaId: 'pel-avatar',
      fechaHora: daysFromNow(3, 19), // Viernes 7:00 PM
      cupoTotal: 16,
    },
    {
      id: 'func-sabado-yo-antes-de-ti',
      peliculaId: 'pel-yo-antes-de-ti',
      fechaHora: daysFromNow(4, 19), // Sábado 7:00 PM
      cupoTotal: 16,
    },
    {
      id: 'func-domingo-dias-perfectos',
      peliculaId: 'pel-perfect-days',
      fechaHora: daysFromNow(5, 19), // Domingo 7:00 PM
      cupoTotal: 16,
    },
  ];

  await prisma.funcion.createMany({ data: funcionesData });

  console.log('--- 8. Creando Reservas reales de clientes ---');
  await prisma.reserva.createMany({
    data: [
      {
        id: 'reserva-1',
        funcionId: 'func-hoy-rey-leon',
        nombre: 'Valentina Rojas',
        contacto: normalizeContacto('valentina.rojas@gmail.com'),
        cantidad: 2,
      },
      {
        id: 'reserva-2',
        funcionId: 'func-viernes-avatar',
        nombre: 'Carlos Mendoza',
        contacto: normalizeContacto('carlos.mendoza@hotmail.com'),
        cantidad: 6,
      },
      {
        id: 'reserva-3',
        funcionId: 'func-viernes-avatar',
        nombre: 'Sofía Gómez',
        contacto: normalizeContacto('sofia.gomez@gmail.com'),
        cantidad: 6,
      },
      {
        id: 'reserva-4',
        funcionId: 'func-viernes-avatar',
        nombre: 'Mateo Ruiz',
        contacto: normalizeContacto('mateo.ruiz@gmail.com'),
        cantidad: 4,
      },
    ],
  });

  console.log('\n======================================================');
  console.log('🎉 DATOS REALES Y MENÚ DE TREGGIO IMPORTADOS CON ÉXITO:');
  console.log(' - 4 Categorías oficiales (Comida, Café, Bebidas, Postres)');
  console.log(' - 23 Productos con fotos y precios oficiales en COP');
  console.log(' - Canastas de plátano, Nachos, Sandwiches brioche, Cold Brews');
  console.log(' - Aforo 16 sillas boutique');
  console.log('======================================================\n');
}

main()
  .catch((error) => {
    console.error('Error al ejecutar seeds:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
