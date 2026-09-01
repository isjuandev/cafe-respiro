import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { fijarHora, HORA_FUNCION } from '../common/utils/horarios';
import { getFiltroCuposOcupados } from '../reservas/reservas.utils';

@Injectable()
export class FuncionesService {
  private logger = new Logger(FuncionesService.name);
  constructor(private prisma: PrismaService) {}

  async findProgramadas() {
    const ahora = new Date();
    const filtroOcupados = getFiltroCuposOcupados(ahora);

    const funciones = await this.prisma.funcion.findMany({
      where: { fechaHora: { gte: ahora } },
      orderBy: { fechaHora: 'asc' },
      include: {
        pelicula: true,
        reservas: {
          where: filtroOcupados,
          select: { cantidad: true },
        },
      },
    });

    return funciones.map((f) => {
      const ocupados = f.reservas.reduce((sum, r) => sum + r.cantidad, 0);
      const { reservas, ...rest } = f;
      return {
        ...rest,
        pelicula: f.pelicula,
        cuposOcupados: ocupados,
        cuposDisponibles: Math.max(0, f.cupoTotal - ocupados),
      };
    });
  }

  // Método compartido para crear función (usado por ambos endpoints)
  async crear(peliculaId: string, fechaHora: Date, cupoTotal: number) {
    if (isNaN(fechaHora.getTime())) throw new BadRequestException('fechaHora inválida');
    fechaHora = fijarHora(fechaHora, HORA_FUNCION);
    if (fechaHora <= new Date()) throw new BadRequestException('fechaHora debe ser futura');
    if (cupoTotal < 1 || cupoTotal > 16) throw new BadRequestException('cupoTotal debe ser 1-16 (sala única)');

    const pelicula = await this.prisma.pelicula.findUnique({ where: { id: peliculaId } });
    if (!pelicula) throw new ConflictException('Película no encontrada');

    // Sala única: validar que no exista otra función ese mismo día calendario (Bogotá 19:00)
    const inicioDia = new Date(fechaHora);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(inicioDia);
    finDia.setDate(finDia.getDate() + 1);
    const conflicto = await this.prisma.funcion.findFirst({
      where: { fechaHora: { gte: inicioDia, lt: finDia } },
      include: { pelicula: true },
    });
    if (conflicto) {
      const dia = conflicto.fechaHora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
      throw new ConflictException(
        `Ya hay una función programada para ${dia} a las 7:00 PM (${conflicto.pelicula.titulo}). Sala única: máximo 1 función por día.`,
      );
    }

    try {
      const funcion = await this.prisma.funcion.create({
        data: { peliculaId, fechaHora, cupoTotal },
        include: { pelicula: true },
      });
      return funcion;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('Ya existe una función para esa fecha. Sala única: máximo 1 función por día.');
      }
      throw e;
    }
  }
}
