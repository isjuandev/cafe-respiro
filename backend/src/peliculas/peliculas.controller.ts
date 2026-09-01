import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PeliculasService } from './peliculas.service';
import { CreatePeliculaDto } from './dto/create-pelicula.dto';
import { ProgramarSugerenciaDto } from '../sugerencias/dto/programar-sugerencia.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FuncionesService } from '../funciones/funciones.service';
import { SugerenciasService } from '../sugerencias/sugerencias.service';
import { TmdbService } from './tmdb.service';

@Controller()
export class PeliculasController {
  private logger = new Logger(PeliculasController.name);

  constructor(
    private peliculasService: PeliculasService,
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private funcionesService: FuncionesService,
    private sugerenciasService: SugerenciasService,
    private tmdbService: TmdbService,
  ) {}

  // Búsqueda opcional de metadatos de películas en TMDB
  @Get('peliculas/buscar-externa')
  async buscarExterna(@Query('q') query?: string) {
    if (!query || query.trim().length < 2) {
      return { enabled: this.tmdbService.isEnabled(), results: [] };
    }
    return this.tmdbService.searchMovies(query);
  }

  @UseGuards(AuthGuard)
  @RequireRole('admin')
  @Get('admin/peliculas')
  async findAdmin() {
    const peliculas = await this.peliculasService.findAllAdmin();
    return { peliculas };
  }

  @UseGuards(AuthGuard)
  @RequireRole('admin')
  @Post('admin/peliculas')
  async create(@Body() dto: CreatePeliculaDto) {
    const result = await this.peliculasService.create(dto);
    if (result.duplicada) {
      return { duplicada: true, pelicula: result.pelicula, aviso: result.aviso };
    }
    return { duplicada: false, pelicula: result.pelicula };
  }

  // Vincular película a sugerencia GANADORA (legacy)
  @UseGuards(AuthGuard)
  @RequireRole('admin')
  @Post('admin/sugerencias/:id/pelicula')
  async crearDesdeSugerencia(@Param('id') id: string) {
    const sugerencia = await this.prisma.sugerencia.findUnique({ where: { id } });
    if (!sugerencia) throw new NotFoundException('Sugerencia no encontrada');
    if (sugerencia.estado !== 'GANADORA') {
      throw new ConflictException(
        'Solo se puede vincular película a una sugerencia GANADORA (ganó votación). Use POST admin/sugerencias/:id/programar para la operación atómica.'
      );
    }
    const pelicula = await this.peliculasService.findOrCreateFromSugerencia(sugerencia);
    const actualizada = await this.prisma.sugerencia.update({
      where: { id },
      data: { peliculaId: pelicula.id },
    });
    return { pelicula, sugerencia: actualizada };
  }

  // Operación de dominio ÚNICA: programar sugerencia GANADORA -> PROGRAMADA
  @UseGuards(AuthGuard)
  @RequireRole('admin')
  @Post('admin/sugerencias/:id/programar')
  async programar(@Param('id') id: string, @Body() dto: ProgramarSugerenciaDto) {
    const result = await this.sugerenciasService.programar(id, dto, { manual: false });
    this.notifications
      .notifySugerenciaProgramada(result.sugerencia)
      .catch((e) => this.logger.warn(`notifySugerenciaProgramada falló: ${e}`));
    return result;
  }

  // Vía explícita para programación manual administrativa
  @UseGuards(AuthGuard)
  @RequireRole('admin')
  @Post('admin/sugerencias/:id/programar-manual')
  async programarManual(@Param('id') id: string, @Body() dto: ProgramarSugerenciaDto) {
    const result = await this.sugerenciasService.programar(id, dto, { manual: true });
    this.notifications
      .notifySugerenciaProgramada(result.sugerencia)
      .catch((e) => this.logger.warn(`notifySugerenciaProgramada manual falló: ${e}`));
    return result;
  }

  // Programar función desde biblioteca (película sin sugerencia previa)
  @UseGuards(AuthGuard)
  @RequireRole('admin')
  @Post('admin/peliculas/:id/funciones')
  async crearFuncionDesdePelicula(
    @Param('id') peliculaId: string,
    @Body() dto: ProgramarSugerenciaDto
  ) {
    const funcion = await this.funcionesService.crear(
      peliculaId,
      new Date(dto.fechaHora),
      Number(dto.cupoTotal)
    );
    return { funcion };
  }
}
