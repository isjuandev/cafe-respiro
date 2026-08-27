import { Controller, Post, Get, Param, Body, UseGuards, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { CreateFuncionDto } from './dto/create-funcion.dto';
import { SugerenciasService } from '../sugerencias/sugerencias.service';
import { NotificationsService } from '../notifications/notifications.service';

@UseGuards(AuthGuard)
@RequireRole('admin')
@Controller('admin/funciones')
export class AdminFuncionesController {
  private logger = new Logger(AdminFuncionesController.name);
  constructor(
    private prisma: PrismaService,
    private sugerenciasService: SugerenciasService,
    private notifications: NotificationsService,
  ) {}

  // LEGACY endpoint: delega a la operación de dominio única SugerenciasService.programar
  // Mantiene compatibilidad con clientes que POST /admin/funciones {sugerenciaId, fechaHora, cupoTotal}
  // Ahora es transaccional y atómico (no deja estados intermedios).
  @Post()
  async create(@Body() dto: CreateFuncionDto) {
    const result = await this.sugerenciasService.programar(dto.sugerenciaId, { fechaHora: dto.fechaHora, cupoTotal: dto.cupoTotal }, { manual: false });
    // Notificación solo después de commit
    this.notifications.notifySugerenciaProgramada(result.sugerencia).catch((e) => this.logger.warn(`notifySugerenciaProgramada (legacy) falló: ${e}`));
    return { funcion: result.funcion, pelicula: result.pelicula, sugerencia: result.sugerencia };
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
