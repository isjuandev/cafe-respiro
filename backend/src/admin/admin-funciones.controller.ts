import { Controller, Post, Get, Param, Body, UseGuards, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from '../common/guards/admin.guard';
import { CreateFuncionDto } from './dto/create-funcion.dto';

@UseGuards(AdminGuard)
@Controller('admin/funciones')
export class AdminFuncionesController {
  private logger = new Logger(AdminFuncionesController.name);
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@Body() dto: CreateFuncionDto) {
    const sugerencia = await this.prisma.sugerencia.findUnique({ where: { id: dto.sugerenciaId } });
    if (!sugerencia) throw new NotFoundException('Sugerencia no encontrada');
    if (sugerencia.estado !== 'PROGRAMADA') {
      throw new ConflictException('Solo se puede crear función desde una sugerencia PROGRAMADA');
    }

    // Upsert Pelicula desde sugerencia.titulo si no tiene peliculaId
    let peliculaId = sugerencia.peliculaId;
    if (!peliculaId) {
      const pelicula = await this.prisma.pelicula.create({
        data: {
          titulo: sugerencia.titulo,
          director: sugerencia.director,
          anio: sugerencia.anio,
        },
      });
      peliculaId = pelicula.id;
      // Vincular sugerencia a pelicula
      await this.prisma.sugerencia.update({
        where: { id: sugerencia.id },
        data: { peliculaId },
      });
    }

    const fechaHora = new Date(dto.fechaHora);
    if (isNaN(fechaHora.getTime())) throw new ConflictException('fechaHora inválida');

    try {
      const funcion = await this.prisma.funcion.create({
        data: {
          peliculaId: peliculaId!,
          fechaHora,
          cupoTotal: dto.cupoTotal,
        },
        include: { pelicula: true },
      });
      return { funcion };
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Ya existe una función para esa película en esa fecha/hora');
      throw e;
    }
  }

  @Get(':id/reservas')
  async reservas(@Param('id') id: string) {
    const funcion = await this.prisma.funcion.findUnique({
      where: { id },
      include: {
        pelicula: true,
        reservas: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!funcion) throw new NotFoundException('Función no encontrada');
    const ocupados = funcion.reservas.reduce((s, r) => s + r.cantidad, 0);
    return {
      funcion: {
        id: funcion.id,
        pelicula: funcion.pelicula,
        fechaHora: funcion.fechaHora,
        cupoTotal: funcion.cupoTotal,
        cuposOcupados: ocupados,
        cuposDisponibles: funcion.cupoTotal - ocupados,
      },
      reservas: funcion.reservas,
      totalReservas: funcion.reservas.length,
    };
  }
}
