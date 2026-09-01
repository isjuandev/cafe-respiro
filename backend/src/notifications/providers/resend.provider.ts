import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationProvider,
  PagoConfirmadoPayload,
  ReservaConfirmadaPayload,
  ReservaRegistradaPayload,
  SugerenciaProgramadaPayload,
} from './notification.provider';

@Injectable()
export class ResendNotificationProvider implements NotificationProvider {
  readonly name = 'ResendEmailProvider';
  private readonly logger = new Logger(ResendNotificationProvider.name);

  private get apiKey(): string | undefined {
    return process.env.RESEND_API_KEY;
  }

  private get fromEmail(): string {
    return process.env.EMAIL_FROM || 'Café Respiro <hola@caferespiro.com>';
  }

  private isValidEmail(target?: string | null): boolean {
    if (!target) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target);
  }

  async sendSugerenciaProgramada(payload: SugerenciaProgramadaPayload): Promise<void> {
    if (!this.apiKey || !this.isValidEmail(payload.contacto)) {
      return;
    }

    const html = `
      <div style="font-family: sans-serif; background: #050507; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
        <h1 style="color: #E8B86A; margin: 0 0 16px 0; font-size: 24px;">¡Tu película fue programada!</h1>
        <p style="color: #dddddd; line-height: 1.6; font-size: 15px;">
          Hola, la película que sugeriste: <strong style="color: #ffffff;">${payload.titulo}</strong> ha sido seleccionada y ya está en la cartelera de <strong>Café Respiro</strong>.
        </p>
        <p style="color: #999999; font-size: 13px; margin-top: 24px;">
          Te esperamos para disfrutar juntos de buen cine y café de especialidad.
        </p>
      </div>
    `;

    await this.sendEmail(payload.contacto, `¡Tu sugerencia "${payload.titulo}" fue programada! — Café Respiro`, html);
  }

  async sendReservaRegistrada(payload: ReservaRegistradaPayload): Promise<void> {
    const targetEmail = this.isValidEmail(payload.email)
      ? payload.email!
      : this.isValidEmail(payload.contacto)
      ? payload.contacto
      : null;

    if (!this.apiKey || !targetEmail) {
      return;
    }

    const fechaStr = new Date(payload.fechaHora).toLocaleString('es-CO', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Bogota',
    });

    const totalStr = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(payload.total);

    const html = `
      <div style="font-family: sans-serif; background: #050507; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
        <h1 style="color: #E8B86A; margin: 0 0 8px 0; font-size: 24px;">Reserva Registrada (Pendiente de Pago)</h1>
        <p style="color: #dddddd; line-height: 1.6; font-size: 15px;">
          Hemos recibido tu solicitud de reserva para <strong style="color: #ffffff;">${payload.pelicula}</strong>.
        </p>
        <div style="background: #141414; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #333333;">
          <p style="margin: 4px 0; color: #aaaaaa; font-size: 13px;">CÓDIGO DE RESERVA:</p>
          <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 20px; color: #E8B86A;">${payload.codigo}</p>
          <p style="margin: 4px 0; color: #aaaaaa; font-size: 13px;">FECHA Y HORA:</p>
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #ffffff;">${fechaStr}</p>
          <p style="margin: 4px 0; color: #aaaaaa; font-size: 13px;">ENTRADAS:</p>
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #ffffff;">${payload.cantidad} persona(s)</p>
          <p style="margin: 4px 0; color: #aaaaaa; font-size: 13px;">TOTAL A TRANSFERIR:</p>
          <p style="margin: 0; font-weight: bold; font-size: 18px; color: #E8B86A;">${totalStr}</p>
        </div>
        <p style="color: #dddddd; font-size: 14px;">
          Por favor envía el comprobante de pago por WhatsApp indicando tu código <strong>${payload.codigo}</strong> antes de que expire tu reserva.
        </p>
      </div>
    `;

    await this.sendEmail(targetEmail, `Reserva registrada: ${payload.codigo} (${payload.pelicula}) — Café Respiro`, html);
  }

  async sendPagoConfirmado(payload: PagoConfirmadoPayload): Promise<void> {
    const targetEmail = this.isValidEmail(payload.email)
      ? payload.email!
      : this.isValidEmail(payload.contacto)
      ? payload.contacto
      : null;

    if (!this.apiKey || !targetEmail) {
      return;
    }

    const fechaStr = new Date(payload.fechaHora).toLocaleString('es-CO', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Bogota',
    });

    const html = `
      <div style="font-family: sans-serif; background: #050507; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
        <h1 style="color: #4ade80; margin: 0 0 8px 0; font-size: 24px;">¡Pago y Entradas Confirmadas! 🎉</h1>
        <p style="color: #dddddd; line-height: 1.6; font-size: 15px;">
          Tu pago ha sido validado exitosamente. Tus entradas para <strong style="color: #ffffff;">${payload.pelicula}</strong> en <strong>Café Respiro</strong> están listas.
        </p>
        <div style="background: #141414; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #333333;">
          <p style="margin: 4px 0; color: #aaaaaa; font-size: 13px;">CÓDIGO DE RESERVA:</p>
          <p style="margin: 0 0 12px 0; font-weight: bold; font-size: 20px; color: #E8B86A;">${payload.codigo}</p>
          <p style="margin: 4px 0; color: #aaaaaa; font-size: 13px;">FECHA Y HORA:</p>
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #ffffff;">${fechaStr}</p>
          <p style="margin: 4px 0; color: #aaaaaa; font-size: 13px;">ENTRADAS CONFIRMADAS:</p>
          <p style="margin: 0; font-weight: bold; color: #4ade80;">${payload.cantidad} persona(s)</p>
        </div>
        <p style="color: #999999; font-size: 13px; margin-top: 24px;">
          Presenta tu código de reserva al ingresar. ¡Te esperamos para una gran noche de cine y café!
        </p>
      </div>
    `;

    await this.sendEmail(targetEmail, `¡Entradas confirmadas! ${payload.codigo} (${payload.pelicula}) — Café Respiro`, html);
  }

  async sendReservaConfirmada(payload: ReservaConfirmadaPayload): Promise<void> {
    if (!this.apiKey || !this.isValidEmail(payload.contacto)) {
      return;
    }

    const fechaStr = new Date(payload.fechaHora).toLocaleString('es-CO', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Bogota',
    });

    const html = `
      <div style="font-family: sans-serif; background: #050507; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
        <h1 style="color: #E8B86A; margin: 0 0 16px 0; font-size: 24px;">Reserva Confirmada</h1>
        <p style="color: #dddddd; line-height: 1.6; font-size: 15px;">
          Tu cupo para ver <strong style="color: #ffffff;">${payload.pelicula}</strong> en <strong>Café Respiro</strong> está asegurado.
        </p>
        <div style="background: #141414; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #333333;">
          <p style="margin: 4px 0; color: #aaaaaa; font-size: 13px;">FECHA Y HORA:</p>
          <p style="margin: 0 0 12px 0; font-weight: bold; color: #ffffff;">${fechaStr}</p>
          <p style="margin: 4px 0; color: #aaaaaa; font-size: 13px;">CUPOS:</p>
          <p style="margin: 0; font-weight: bold; color: #E8B86A;">${payload.cantidad} persona(s)</p>
        </div>
      </div>
    `;

    await this.sendEmail(payload.contacto, `Reserva confirmada: ${payload.pelicula} — Café Respiro`, html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.warn(`Resend API devolvió error ${res.status}: ${errorText}`);
      } else {
        this.logger.log(`Email enviado con éxito a ${to} vía Resend`);
      }
    } catch (e) {
      this.logger.warn(`Error al despachar email vía Resend: ${e}`);
    }
  }
}
