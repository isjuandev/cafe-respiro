import { Injectable, Logger } from '@nestjs/common';
import { captchaConfig } from './captcha.config';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  isEnabled(): boolean {
    return captchaConfig.enabled;
  }

  /**
   * Verifica token contra proveedor. Si CAPTCHA está deshabilitado, siempre true.
   * No lanza si el proveedor falla: logea y permite pasar para no bloquear legítimos
   * en caso de caída del proveedor (fail-open). Cambiar a fail-closed si se prefiere.
   */
  async verify(token: string | undefined, ip?: string): Promise<{ success: boolean; reason?: string }> {
    if (!captchaConfig.enabled) {
      return { success: true };
    }

    if (!token) {
      return { success: false, reason: 'Captcha requerido' };
    }

    if (!captchaConfig.secretKey) {
      this.logger.warn('CAPTCHA_ENABLED=true pero CAPTCHA_SECRET_KEY no configurado; bypass temporal');
      return { success: true };
    }

    try {
      const form = new URLSearchParams();
      form.append('secret', captchaConfig.secretKey);
      form.append('response', token);
      if (ip) form.append('remoteip', ip);

      const res = await fetch(captchaConfig.siteVerifyUrl, {
        method: 'POST',
        body: form,
      });

      const data: any = await res.json();
      if (data.success) {
        return { success: true };
      }
      this.logger.warn(`Captcha verificación falló: ${JSON.stringify(data['error-codes'] || data)}`);
      return { success: false, reason: 'Captcha inválido' };
    } catch (e) {
      this.logger.error(`Error verificando captcha: ${e}`);
      // Fail-open para no bloquear en caída de proveedor
      return { success: true, reason: 'Bypass por error de proveedor' };
    }
  }
}
