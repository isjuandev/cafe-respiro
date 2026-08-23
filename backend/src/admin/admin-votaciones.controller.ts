import { Controller, Post, UseGuards, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from '../common/guards/admin.guard';
import { NotificationsService } from '../notifications/notifications.service';

@UseGuards(AdminGuard)
@Controller('admin/votaciones')
export class AdminVotacionesController {
  private logger = new Logger(AdminVotacionesController.name);
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  @Post('cerrar')
  async cerrar() {
    // Cierra la votación activa: todas las PENDIENTE pasan a DESCARTADA
    // La más votada se mantiene? Para MVP, cerramos todo y el admin ya programó la ganadora via crear función.
    const result = await this.prisma.sugerencia.updateMany({
      where: { estado: 'PENDIENTE' },
      data: { estado: 'DESCARTADA' },
    });

    this.logger.log(`Votación cerrada: ${result.count} sugerencias pasaron a DESCARTADA`);
    // Log como notificación para auditoría
    try {
      await this.prisma.notificationLog.create({
        data: {
          tipo: 'VOTACION_CERRADA',
          payload: { cerradas: result.count, at: new Date().toISOString() },
        },
      });
    } catch (e) {
      this.logger.warn(`NotificationLog VOTACION_CERRADA falló: ${e}`);
    }

    return { ok: true, cerradas: result.count };
  }
}
