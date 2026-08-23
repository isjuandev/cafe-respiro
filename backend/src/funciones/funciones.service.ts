import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FuncionesService {
  private logger = new Logger(FuncionesService.name);
  constructor(private prisma: PrismaService) {}

  async findProgramadas() {
    const ahora = new Date();
    const funciones = await this.prisma.funcion.findMany({
      where: { fechaHora: { gte: ahora } },
      orderBy: { fechaHora: 'asc' },
      include: {
        pelicula: true,
        reservas: { select: { cantidad: true } },
      },
    });

    return funciones.map((f) => {
      const ocupados = f.reservas.reduce((sum, r) => sum + r.cantidad, 0);
      const { reservas, ...rest } = f;
      return {
        ...rest,
        pelicula: f.pelicula,
        cuposOcupados: ocupados,
        cuposDisponibles: f.cupoTotal - ocupados,
      };
    });
  }

  // Método compartido para crear función (usado por ambos endpoints)
  async crear(peliculaId: string, fechaHora: Date, cupoTotal: number) {
    if (isNaN(fechaHora.getTime())) throw new BadRequestException('fechaHora inválida');
    if (fechaHora <= new Date()) throw new BadRequestException('fechaHora debe ser futura');
    if (cupoTotal < 1 || cupoTotal > 200) throw new BadRequestException('cupoTotal debe ser 1-200');

    const pelicula = await this.prisma.pelicula.findUnique({ where: { id: peliculaId } });
    if (!pelicula) throw new ConflictException('Película no encontrada');

    try {
      const funcion = await this.prisma.funcion.create({
        data: { peliculaId, fechaHora, cupoTotal },
        include: { pelicula: true },
      });
      return funcion;
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Ya existe una función para esa película en esa fecha/hora');
      throw e;
    }
  }
}
