import { Controller, Post, Get, Param, Body, UseGuards, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from '../common/guards/admin.guard';
import { CreateFuncionDto } from './dto/create-funcion.dto';
import { PeliculasService } from '../peliculas/peliculas.service';
import { FuncionesService } from '../funciones/funciones.service';

@UseGuards(AdminGuard)
@Controller('admin/funciones')
export class AdminFuncionesController {
  constructor(
    private prisma: PrismaService,
    private peliculasService: PeliculasService,
    private funcionesService: FuncionesService,
  ) {}

  // Atajo legacy: crear función desde sugerencia PROGRAMADA (reusa normalización y servicio compartido)
  @Post()
  async create(@Body() dto: CreateFuncionDto) {
    const sugerencia = await this.prisma.sugerencia.findUnique({ where: { id: dto.sugerenciaId } });
    if (!sugerencia) throw new NotFoundException('Sugerencia no encontrada');
    if (sugerencia.estado !== 'PROGRAMADA') {
      throw new ConflictException('Solo se puede crear función desde una sugerencia PROGRAMADA');
    }

    // Reusa normalización Sprint 1: busca o crea película de forma deduplicada
    let peliculaId = sugerencia.peliculaId;
    if (!peliculaId) {
      const pelicula = await this.peliculasService.findOrCreateFromSugerencia(sugerencia);
      peliculaId = pelicula.id;
      await this.prisma.sugerencia.update({ where: { id: sugerencia.id }, data: { peliculaId } });
    }

    const funcion = await this.funcionesService.crear(peliculaId!, new Date(dto.fechaHora), Number(dto.cupoTotal));
    return { funcion };
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
