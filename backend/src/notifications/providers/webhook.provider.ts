import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationProvider,
  PagoConfirmadoPayload,
  ReservaConfirmadaPayload,
  ReservaRegistradaPayload,
  SugerenciaProgramadaPayload,
} from './notification.provider';

@Injectable()
export class WebhookNotificationProvider implements NotificationProvider {
  readonly name = 'WebhookNotificationProvider';
  private readonly logger = new Logger(WebhookNotificationProvider.name);

  private get webhookUrl(): string | undefined {
    return process.env.NOTIFICATION_WEBHOOK_URL;
  }

  async sendSugerenciaProgramada(payload: SugerenciaProgramadaPayload): Promise<void> {
    if (!this.webhookUrl) return;
    await this.postWebhook('SUGERENCIA_PROGRAMADA', payload);
  }

  async sendReservaRegistrada(payload: ReservaRegistradaPayload): Promise<void> {
    if (!this.webhookUrl) return;
    await this.postWebhook('RESERVA_REGISTRADA', payload);
  }

  async sendPagoConfirmado(payload: PagoConfirmadoPayload): Promise<void> {
    if (!this.webhookUrl) return;
    await this.postWebhook('PAGO_CONFIRMADO', payload);
  }

  async sendReservaConfirmada(payload: ReservaConfirmadaPayload): Promise<void> {
    if (!this.webhookUrl) return;
    await this.postWebhook('RESERVA_CONFIRMADA', payload);
  }

  private async postWebhook(event: string, data: any): Promise<void> {
    try {
      const res = await fetch(this.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data,
        }),
      });

      if (!res.ok) {
        this.logger.warn(`Webhook devolvió error ${res.status}`);
      } else {
        this.logger.log(`Evento ${event} enviado exitosamente al webhook`);
      }
    } catch (e) {
      this.logger.warn(`Error al despachar evento ${event} al webhook: ${e}`);
    }
  }
}
