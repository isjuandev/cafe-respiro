import { Injectable, BadRequestException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSugerenciaDto } from './dto/create-sugerencia.dto';
import { ProgramarSugerenciaDto } from './dto/programar-sugerencia.dto';
import { normalizeTitulo, normalizeContacto } from '../common/utils/normalize';
import { fijarHora, HORA_FUNCION } from '../common/utils/horarios';
import { Prisma } from '@prisma/client';

@Injectable()
export class SugerenciasService {
  private logger = new Logger(SugerenciasService.name);
  constructor(private prisma: PrismaService) {}

  async findActivas() {
    const sugerencias = await this.prisma.sugerencia.findMany({
      where: { estado: 'PENDIENTE' },
      include: {
        _count: { select: { votos: true } },
      },
    });
    // Orden ranking: votos desc, luego más reciente primero
    return sugerencias.sort((a, b) => {
      if (b._count.votos !== a._count.votos) return b._count.votos - a._count.votos;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  async create(dto: CreateSugerenciaDto) {
    const tituloNormalizado = normalizeTitulo(dto.titulo);
    const contactoNormalizado = normalizeContacto(dto.contacto);

    // Intento directo — la garantía anti-carrera está en el índice parcial único de PG
    // Incluye PENDIENTE, GANADORA y PROGRAMADA como activos (ver migración 20260829)
    try {
      const creada = await this.prisma.sugerencia.create({
        data: {
          titulo: dto.titulo.trim(),
          tituloNormalizado,
          director: dto.director?.trim() || null,
          genero: dto.genero?.trim() || null,
          anio: dto.anio ?? null,
          duracionMin: dto.duracionMin ?? null,
          sinopsis: dto.sinopsis?.trim() || null,
          posterUrl: dto.posterUrl?.trim() || null,
          comentario: dto.comentario?.trim() || null,
          nombreSolicitante: dto.nombre.trim(),
          contacto: contactoNormalizado,
          estado: 'PENDIENTE',
        },
      });
      return { duplicada: false, sugerencia: creada };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Violación del índice parcial único → ya existe una activa con mismo tituloNormalizado
        const existente = await this.prisma.sugerencia.findFirst({
          where: {
            tituloNormalizado,
            estado: { in: ['PENDIENTE', 'GANADORA', 'PROGRAMADA'] },
          },
          include: { _count: { select: { votos: true } } },
        });
        if (existente) {
          return { duplicada: true, sugerencia: existente };
        }
      }
      throw error;
    }
  }

  /**
   * Operación de dominio única y atómica: programar una sugerencia ganadora.
   * Reúne los 6 pasos en una sola transacción:
   * 1) verifica sugerencia existe, 2) verifica GANADORA (o PENDIENTE si manual), 3) findOrCreate Pelicula,
   * 4) crear Funcion (con validación sala única), 5) update Sugerencia peliculaId, 6) PROGRAMADA.
   * Notificación debe hacerse DESPUÉS del commit (el caller lo hace).
   */
  async programar(sugerenciaId: string, dto: ProgramarSugerenciaDto, opts: { manual?: boolean } = {}) {
    const manual = !!opts.manual;

    // Validaciones fuera de transacción (existencia y estado) para mensaje rápido, pero se revalidan dentro.
    const sugerenciaPre = await this.prisma.sugerencia.findUnique({ where: { id: sugerenciaId } });
    if (!sugerenciaPre) throw new NotFoundException('Sugerencia no encontrada');
    if (!manual && sugerenciaPre.estado !== 'GANADORA') {
      throw new ConflictException('Solo se puede programar una sugerencia GANADORA. Para programación manual use el endpoint manual.');
    }
    if (manual && !['PENDIENTE', 'GANADORA'].includes(sugerenciaPre.estado)) {
      throw new ConflictException('Programación manual solo para PENDIENTE o GANADORA');
    }
    if (sugerenciaPre.estado === 'PROGRAMADA') {
      throw new ConflictException('Sugerencia ya PROGRAMADA');
    }

    let fechaHora = new Date(dto.fechaHora);
    if (isNaN(fechaHora.getTime())) throw new BadRequestException('fechaHora inválida');
    fechaHora = fijarHora(fechaHora, HORA_FUNCION);
    if (fechaHora <= new Date()) throw new BadRequestException('fechaHora debe ser futura');
    if (!Number.isInteger(dto.cupoTotal) || dto.cupoTotal < 1 || dto.cupoTotal > 15) {
      throw new BadRequestException('cupoTotal debe ser entero 1-15');
    }

    // Transacción atómica: Pelicula + Funcion + Sugerencia
    const result = await this.prisma.$transaction(async (tx) => {
      // Revalidar dentro de la transacción para evitar race
      const sugerencia = await tx.sugerencia.findUnique({ where: { id: sugerenciaId } });
      if (!sugerencia) throw new NotFoundException('Sugerencia no encontrada');
      if (!manual && sugerencia.estado !== 'GANADORA') throw new ConflictException('Solo GANADORA puede programarse (verificación transaccional)');
      if (manual && !['PENDIENTE', 'GANADORA'].includes(sugerencia.estado)) throw new ConflictException('Programación manual solo para PENDIENTE o GANADORA');
      if (sugerencia.estado === 'PROGRAMADA') throw new ConflictException('Ya PROGRAMADA (transaccional)');

      // 3) Obtener o crear Pelicula (misma normalización que PeliculasService)
      const tituloNormalizado = normalizeTitulo(sugerencia.titulo);
      let pelicula = await tx.pelicula.findFirst({ where: { tituloNormalizado } });
      if (!pelicula) {
        pelicula = await tx.pelicula.create({
          data: {
            titulo: sugerencia.titulo.trim(),
            tituloNormalizado,
            director: sugerencia.director?.trim() || null,
            genero: sugerencia.genero?.trim() || null,
            anio: sugerencia.anio ?? null,
            duracionMin: sugerencia.duracionMin ?? null,
            sinopsis: sugerencia.sinopsis?.trim() || null,
            posterUrl: sugerencia.posterUrl?.trim() || null,
          },
        });
      }

      // 4) Crear Funcion con validación sala única DENTRO de la transacción
      const inicioDia = new Date(fechaHora);
      inicioDia.setHours(0, 0, 0, 0);
      const finDia = new Date(inicioDia);
      finDia.setDate(finDia.getDate() + 1);
      const conflicto = await tx.funcion.findFirst({
        where: { fechaHora: { gte: inicioDia, lt: finDia } },
      });
      if (conflicto) {
        throw new ConflictException('Ya existe una función para esa fecha. Sala única: máximo 1 por día.');
      }

      let funcion;
      try {
        funcion = await tx.funcion.create({
          data: { peliculaId: pelicula.id, fechaHora, cupoTotal: dto.cupoTotal },
          include: { pelicula: true },
        });
      } catch (e: any) {
        if (e.code === 'P2002') throw new ConflictException('Ya existe una función para esa fecha (índice único).');
        throw e;
      }

      // 5+6) Actualizar Sugerencia con peliculaId + PROGRAMADA
      const actualizada = await tx.sugerencia.update({
        where: { id: sugerenciaId },
        data: { peliculaId: pelicula.id, estado: 'PROGRAMADA' },
      });

      return { pelicula, funcion, sugerencia: actualizada };
    });

    return result;
  }
}
