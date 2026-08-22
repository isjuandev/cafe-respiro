import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async notifySugerenciaProgramada(sugerencia: any) {
    const payload = {
      sugerenciaId: sugerencia.id,
      titulo: sugerencia.titulo,
      contacto: sugerencia.contacto,
    };
    this.logger.log(`[NOTIFY] Sugerencia programada: ${sugerencia.titulo} (${sugerencia.id})`);
    try {
      await this.prisma.notificationLog.create({
        data: {
          tipo: 'SUGERENCIA_PROGRAMADA',
          destinatario: sugerencia.contacto,
          payload,
        },
      });
    } catch (e) {
      this.logger.warn(`NotificationLog falló (sugerencia programada): ${e}`);
    }
  }

  async notifyReservaConfirmada(reserva: any, funcion: any) {
    const payload = {
      reservaId: reserva.id,
      funcionId: funcion.id,
      pelicula: funcion.pelicula?.titulo ?? funcion.peliculaId,
      fechaHora: funcion.fechaHora,
      cantidad: reserva.cantidad,
    };
    this.logger.log(`[NOTIFY] Reserva confirmada: ${reserva.id} para funcion ${funcion.id} (${reserva.cantidad} personas)`);
    try {
      await this.prisma.notificationLog.create({
        data: {
          tipo: 'RESERVA_CONFIRMADA',
          destinatario: reserva.contacto,
          payload,
        },
      });
    } catch (e) {
      this.logger.warn(`NotificationLog falló (reserva confirmada): ${e}`);
    }
  }
}
