import { Controller, Get, Post, Body, Param, UseGuards, NotFoundException, Logger } from '@nestjs/common';
import { PeliculasService } from './peliculas.service';
import { CreatePeliculaDto } from './dto/create-pelicula.dto';
import { AdminGuard } from '../common/guards/admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FuncionesService } from '../funciones/funciones.service';
import { normalizeTitulo } from '../common/utils/normalize';

@Controller()
export class PeliculasController {
  private logger = new Logger(PeliculasController.name);
  constructor(
    private peliculasService: PeliculasService,
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private funcionesService: FuncionesService,
  ) {}

  @UseGuards(AdminGuard)
  @Get('admin/peliculas')
  async findAdmin() {
    const peliculas = await this.peliculasService.findAllAdmin();
    return { peliculas };
  }

  @UseGuards(AdminGuard)
  @Post('admin/peliculas')
  async create(@Body() dto: CreatePeliculaDto) {
    const result = await this.peliculasService.create(dto);
    if (result.duplicada) {
      return { duplicada: true, pelicula: result.pelicula, aviso: result.aviso };
    }
    return { duplicada: false, pelicula: result.pelicula };
  }

  // 1. Crear película desde sugerencia: actualiza estado → PROGRAMADA + peliculaId y notifica
  @UseGuards(AdminGuard)
  @Post('admin/sugerencias/:id/pelicula')
  async crearDesdeSugerencia(@Param('id') id: string) {
    const sugerencia = await this.prisma.sugerencia.findUnique({ where: { id } });
    if (!sugerencia) throw new NotFoundException('Sugerencia no encontrada');

    // Reusa normalización Sprint 1 para deduplicar catálogo
    const pelicula = await this.peliculasService.findOrCreateFromSugerencia(sugerencia);

    // Actualiza sugerencia: vincula pelicula y pasa a PROGRAMADA si estaba PENDIENTE
    const actualizada = await this.prisma.sugerencia.update({
      where: { id },
      data: { peliculaId: pelicula.id, estado: 'PROGRAMADA' },
    });

    // Notify post-commit con cliente global
    this.notifications.notifySugerenciaProgramada(actualizada).catch((e) => this.logger.warn(`notifySugerenciaProgramada falló: ${e}`));

    return { pelicula, sugerencia: actualizada };
  }

  // 2. Programar función desde biblioteca: busca sugerencia coincidente por tituloNormalizado y notifica si hay match
  @UseGuards(AdminGuard)
  @Post('admin/peliculas/:id/funciones')
  async crearFuncionDesdePelicula(
    @Param('id') peliculaId: string,
    @Body() body: { fechaHora: string; cupoTotal: number },
  ) {
    const funcion = await this.funcionesService.crear(peliculaId, new Date(body.fechaHora), Number(body.cupoTotal));

    // Busca sugerencia pendiente/programada con mismo tituloNormalizado (si admin programó "por biblioteca" sin usar atajo)
    const pelicula = await this.prisma.pelicula.findUnique({ where: { id: peliculaId } });
    if (pelicula?.tituloNormalizado) {
      const sugerenciaMatch = await this.prisma.sugerencia.findFirst({
        where: { tituloNormalizado: pelicula.tituloNormalizado, estado: { in: ['PENDIENTE', 'PROGRAMADA'] } },
      });
      if (sugerenciaMatch) {
        // Vincula y notifica (si ya estaba programada, igual notificamos por si faltó)
        const actualizada = await this.prisma.sugerencia.update({
          where: { id: sugerenciaMatch.id },
          data: { peliculaId, estado: 'PROGRAMADA' },
        });
        this.notifications.notifySugerenciaProgramada(actualizada).catch((e) => this.logger.warn(`notifySugerenciaProgramada (via biblioteca) falló: ${e}`));
      }
    }

    return { funcion };
  }
}
