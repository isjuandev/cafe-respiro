import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResendNotificationProvider } from './providers/resend.provider';
import { WebhookNotificationProvider } from './providers/webhook.provider';
import {
  PagoConfirmadoPayload,
  ReservaConfirmadaPayload,
  ReservaRegistradaPayload,
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

    await Promise.allSettled([
      this.resendProvider.sendSugerenciaProgramada(payload),
      this.webhookProvider.sendSugerenciaProgramada(payload),
    ]);
  }

  /**
   * Disparado post-commit inmediatamente al registrar una reserva en Paso 3 (Pendiente de pago).
   */
  async notifyReservaRegistrada(reserva: any, funcion: any): Promise<void> {
    const payload: ReservaRegistradaPayload = {
      reservaId: reserva.id,
      codigo: reserva.codigo,
      funcionId: funcion.id,
      pelicula: funcion.pelicula?.titulo ?? funcion.peliculaId,
      fechaHora: funcion.fechaHora,
      cantidad: reserva.cantidad,
      total: reserva.total,
      contacto: reserva.contacto,
      email: reserva.email,
      expiraEn: reserva.expiraEn,
    };

    this.logger.log(
      `[NOTIFY] Reserva registrada: ${reserva.codigo} (${reserva.id}) para función ${funcion.id}`
    );

    try {
      await this.prisma.notificationLog.create({
        data: {
          tipo: 'RESERVA_REGISTRADA',
          destinatario: reserva.email || reserva.contacto,
          payload: payload as any,
        },
      });
    } catch (e) {
      this.logger.warn(`NotificationLog falló (reserva registrada): ${e}`);
    }

    await Promise.allSettled([
      this.resendProvider.sendReservaRegistrada(payload),
      this.webhookProvider.sendReservaRegistrada(payload),
    ]);
  }

  /**
   * Disparado post-commit cuando el administrador valida y marca como pagada la reserva.
   */
  async notifyPagoConfirmado(reserva: any, funcion: any): Promise<void> {
    const payload: PagoConfirmadoPayload = {
      reservaId: reserva.id,
      codigo: reserva.codigo,
      funcionId: funcion.id,
      pelicula: funcion.pelicula?.titulo ?? funcion.peliculaId,
      fechaHora: funcion.fechaHora,
      cantidad: reserva.cantidad,
      total: reserva.total,
      contacto: reserva.contacto,
      email: reserva.email,
      confirmadoEn: reserva.confirmadoEn || new Date(),
    };

    this.logger.log(
      `[NOTIFY] Pago confirmado: ${reserva.codigo} (${reserva.id}) - Entradas confirmadas`
    );

    try {
      await this.prisma.notificationLog.create({
        data: {
          tipo: 'PAGO_CONFIRMADO',
          destinatario: reserva.email || reserva.contacto,
          payload: payload as any,
        },
      });
    } catch (e) {
      this.logger.warn(`NotificationLog falló (pago confirmado): ${e}`);
    }

    await Promise.allSettled([
      this.resendProvider.sendPagoConfirmado(payload),
      this.webhookProvider.sendPagoConfirmado(payload),
    ]);
  }

  /**
   * Compatibilidad hacia atrás
   */
  async notifyReservaConfirmada(reserva: any, funcion: any): Promise<void> {
    const payload: ReservaConfirmadaPayload = {
      reservaId: reserva.id,
      funcionId: funcion.id,
      pelicula: funcion.pelicula?.titulo ?? funcion.peliculaId,
      fechaHora: funcion.fechaHora,
      cantidad: reserva.cantidad,
      contacto: reserva.contacto,
    };

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

    await Promise.allSettled([
      this.resendProvider.sendReservaConfirmada(payload),
      this.webhookProvider.sendReservaConfirmada(payload),
    ]);
  }
}
