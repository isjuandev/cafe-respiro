import { Controller, Post, Get, Delete, Param, Body, UseGuards, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { CreateFuncionDto } from './dto/create-funcion.dto';
import { SugerenciasService } from '../sugerencias/sugerencias.service';
import { FuncionesService } from '../funciones/funciones.service';
import { NotificationsService } from '../notifications/notifications.service';
import { getEstadoEfectivo, getFiltroCuposOcupados } from '../reservas/reservas.utils';

@UseGuards(AuthGuard)
@RequireRole('admin')
@Controller('admin/funciones')
export class AdminFuncionesController {
  private logger = new Logger(AdminFuncionesController.name);
  constructor(
    private prisma: PrismaService,
    private sugerenciasService: SugerenciasService,
    private funcionesService: FuncionesService,
    private notifications: NotificationsService,
  ) {}

  @Post()
  async create(@Body() dto: CreateFuncionDto) {
    const result = await this.sugerenciasService.programar(dto.sugerenciaId, { fechaHora: dto.fechaHora, cupoTotal: dto.cupoTotal }, { manual: false });
    this.notifications.notifySugerenciaProgramada(result.sugerencia).catch((e) => this.logger.warn(`notifySugerenciaProgramada falló: ${e}`));
    return { funcion: result.funcion, pelicula: result.pelicula, sugerencia: result.sugerencia };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.funcionesService.eliminar(id);
  }

  @Get(':id/reservas')
  async reservas(@Param('id') id: string) {
    const ahora = new Date();
    const funcion = await this.prisma.funcion.findUnique({
      where: { id },
      include: {
        pelicula: true,
        reservas: {
          include: {
            items: { include: { tipoEntrada: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!funcion) throw new NotFoundException('Función no encontrada');

    const filtro = getFiltroCuposOcupados(ahora);
    // Calcular cupos ocupados considerando solo reservas activas
    const reservasOcupantes = funcion.reservas.filter((r) => {
      const estadoEfectivo = getEstadoEfectivo(r, ahora);
      return estadoEfectivo === 'CONFIRMADA' || estadoEfectivo === 'PENDIENTE_PAGO';
    });
    const ocupados = reservasOcupantes.reduce((s, r) => s + r.cantidad, 0);

    const reservasConEstado = funcion.reservas.map((r) => ({
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      contacto: r.contacto,
      email: r.email,
      cantidad: r.cantidad,
      total: r.total,
      estado: r.estado,
      estadoEfectivo: getEstadoEfectivo(r, ahora),
      expiraEn: r.expiraEn,
      confirmadoEn: r.confirmadoEn,
      confirmadoPorAdminId: r.confirmadoPorAdminId,
      createdAt: r.createdAt,
      items: r.items.map((i) => ({
        tipoEntrada: i.tipoEntrada.nombre,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        subtotal: i.subtotal,
      })),
    }));

    return {
      funcion: {
        id: funcion.id,
        pelicula: funcion.pelicula,
        fechaHora: funcion.fechaHora,
        cupoTotal: funcion.cupoTotal,
        cuposOcupados: ocupados,
        cuposDisponibles: Math.max(0, funcion.cupoTotal - ocupados),
      },
      reservas: reservasConEstado,
      totalReservas: reservasConEstado.length,
    };
  }
}
