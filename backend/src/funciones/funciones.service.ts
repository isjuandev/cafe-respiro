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
  // Si el día solicitado está ocupado:
  // - sin reservas -> reemplaza película (reprograma)
  // - con reservas -> busca siguiente día libre sin reservas (hasta 30 días)
  async crear(peliculaId: string, fechaHora: Date, cupoTotal: number) {
    if (isNaN(fechaHora.getTime())) throw new BadRequestException('fechaHora inválida');
    fechaHora = fijarHora(fechaHora, HORA_FUNCION);
    if (fechaHora <= new Date()) throw new BadRequestException('fechaHora debe ser futura');
    if (cupoTotal < 1 || cupoTotal > 16) throw new BadRequestException('cupoTotal debe ser 1-16 (sala única)');

    const pelicula = await this.prisma.pelicula.findUnique({ where: { id: peliculaId } });
    if (!pelicula) throw new ConflictException('Película no encontrada');

    const MAX_DIAS_BUSQUEDA = 30;
    let fechaAsignada = new Date(fechaHora);
    const fechaOriginal = new Date(fechaHora);

    for (let intento = 0; intento < MAX_DIAS_BUSQUEDA; intento++) {
      const inicioDia = new Date(fechaAsignada);
      inicioDia.setHours(0, 0, 0, 0);
      const finDia = new Date(inicioDia);
      finDia.setDate(finDia.getDate() + 1);

      const conflicto = await this.prisma.funcion.findFirst({
        where: { fechaHora: { gte: inicioDia, lt: finDia } },
        include: { pelicula: true },
      });

      if (!conflicto) {
        try {
          const funcion = await this.prisma.funcion.create({
            data: { peliculaId, fechaHora: fechaAsignada, cupoTotal },
            include: { pelicula: true },
          });
          if (fechaAsignada.getTime() !== fechaOriginal.getTime()) {
            this.logger.log(`Función desplazada de ${fechaOriginal.toISOString().slice(0, 10)} a ${fechaAsignada.toISOString().slice(0, 10)} por ocupación`);
          }
          return funcion;
        } catch (e: any) {
          if (e.code === 'P2002') {
            fechaAsignada = new Date(fechaAsignada);
            fechaAsignada.setDate(fechaAsignada.getDate() + 1);
            fechaAsignada = fijarHora(fechaAsignada, HORA_FUNCION);
            continue;
          }
          throw e;
        }
      }

      const ocupados = await this.prisma.reserva.count({
        where: { funcionId: conflicto.id, ...getFiltroCuposOcupados(new Date()) },
      });

      if (ocupados > 0) {
        this.logger.log(`Día ${fechaAsignada.toISOString().slice(0, 10)} ocupado con ${ocupados} reservas (${conflicto.pelicula.titulo}), buscando siguiente`);
        fechaAsignada = new Date(fechaAsignada);
        fechaAsignada.setDate(fechaAsignada.getDate() + 1);
        fechaAsignada = fijarHora(fechaAsignada, HORA_FUNCION);
        continue;
      }

      // Sin reservas -> reemplazar
      this.logger.log(`Reemplazando función ${conflicto.id} del ${fechaAsignada.toISOString().slice(0, 10)} (${conflicto.pelicula.titulo}) por ${pelicula.titulo}`);
      const funcion = await this.prisma.funcion.update({
        where: { id: conflicto.id },
        data: { peliculaId, cupoTotal, fechaHora: fechaAsignada },
        include: { pelicula: true },
      });
      return funcion;
    }

    throw new ConflictException(`No se encontró día disponible en los próximos ${MAX_DIAS_BUSQUEDA} días. Todas las funciones tienen reservas.`);
  }
}
