import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResendNotificationProvider } from './providers/resend.provider';
import { WebhookNotificationProvider } from './providers/webhook.provider';
import {
  ReservaConfirmadaPayload,
  SugerenciaProgramadaPayload,
} from './providers/notification.provider';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resendProvider: ResendNotificationProvider,
    private readonly webhookProvider: WebhookNotificationProvider,
  ) {}

  async notifySugerenciaProgramada(sugerencia: any): Promise<void> {
    const payload: SugerenciaProgramadaPayload = {
      sugerenciaId: sugerencia.id,
      titulo: sugerencia.titulo,
      contacto: sugerencia.contacto,
    };

    this.logger.log(`[NOTIFY] Sugerencia programada: ${sugerencia.titulo} (${sugerencia.id})`);

    // 1. Registro obligatorio en DB para auditoría
    try {
      await this.prisma.notificationLog.create({
        data: {
          tipo: 'SUGERENCIA_PROGRAMADA',
          destinatario: sugerencia.contacto,
          payload: payload as any,
        },
      });
    } catch (e) {
      this.logger.warn(`NotificationLog falló (sugerencia programada): ${e}`);
    }

    // 2. Despacho a proveedores externos en paralelo (fire & forget seguro)
    await Promise.allSettled([
      this.resendProvider.sendSugerenciaProgramada(payload),
      this.webhookProvider.sendSugerenciaProgramada(payload),
    ]);
  }

  async notifyReservaConfirmada(reserva: any, funcion: any): Promise<void> {
    const payload: ReservaConfirmadaPayload = {
      reservaId: reserva.id,
      funcionId: funcion.id,
      pelicula: funcion.pelicula?.titulo ?? funcion.peliculaId,
      fechaHora: funcion.fechaHora,
      cantidad: reserva.cantidad,
      contacto: reserva.contacto,
    };

    this.logger.log(
      `[NOTIFY] Reserva confirmada: ${reserva.id} para funcion ${funcion.id} (${reserva.cantidad} personas)`
    );

    // 1. Registro obligatorio en DB
    try {
      await this.prisma.notificationLog.create({
        data: {
          tipo: 'RESERVA_CONFIRMADA',
          destinatario: reserva.contacto,
          payload: payload as any,
        },
      });
    } catch (e) {
      this.logger.warn(`NotificationLog falló (reserva confirmada): ${e}`);
    }

    // 2. Despacho a proveedores externos en paralelo
    await Promise.allSettled([
      this.resendProvider.sendReservaConfirmada(payload),
      this.webhookProvider.sendReservaConfirmada(payload),
    ]);
  }
}
