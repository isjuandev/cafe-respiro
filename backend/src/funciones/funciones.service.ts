import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FuncionesService {
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

    // Calcula cupos disponibles: cupoTotal - sum(reservas.cantidad)
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
}
