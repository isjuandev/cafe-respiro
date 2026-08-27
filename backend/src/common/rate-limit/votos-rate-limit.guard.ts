import { CanActivate, ExecutionContext, Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { RateLimitService } from './rate-limit.service';
import { rateLimitConfig } from './rate-limit.config';
import { CaptchaService } from '../captcha/captcha.service';
import { normalizeContacto } from '../utils/normalize';

@Injectable()
export class VotosRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(VotosRateLimitGuard.name);

  constructor(
    private readonly rateLimit: RateLimitService,
    private readonly captcha: CaptchaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { ip: string }>();
    const res = context.switchToHttp().getResponse<Response>();

    // 1. CAPTCHA layer (opcional, solo si está habilitado)
    if (this.captcha.isEnabled()) {
      const token = (req.headers['x-captcha-token'] as string) || (req.body as any)?.captchaToken;
      const ip = this.getIp(req);
      const result = await this.captcha.verify(token, ip);
      if (!result.success) {
        this.logger.warn(`Captcha falló IP=${ip} reason=${result.reason}`);
        throw new HttpException(
          { statusCode: HttpStatus.FORBIDDEN, message: result.reason || 'Captcha requerido', error: 'Forbidden' },
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const ip = this.getIp(req);
    const contactoRaw = (req.body as any)?.contacto as string | undefined;
    const contacto = contactoRaw ? normalizeContacto(contactoRaw) : null;
    const sugerenciaId = (req.params as any)?.id as string | undefined;

    // 2. Rate limit por IP (burst + ventana principal + ventana hora)
    const ipBurst = this.rateLimit.hit(`voto:ip:burst:${ip}`, rateLimitConfig.ip.burst.windowMs, rateLimitConfig.ip.burst.max);
    if (!ipBurst.allowed) {
      return this.block(res, ip, `IP burst`, ipBurst.retryAfterMs, sugerenciaId, contacto);
    }

    const ipLimit = this.rateLimit.hit(`voto:ip:${ip}`, rateLimitConfig.ip.windowMs, rateLimitConfig.ip.max);
    if (!ipLimit.allowed) {
      return this.block(res, ip, `IP`, ipLimit.retryAfterMs, sugerenciaId, contacto);
    }

    if (rateLimitConfig.ip.hourMax > 0) {
      const ipHour = this.rateLimit.hit(`voto:ip:hour:${ip}`, rateLimitConfig.ip.hourWindowMs, rateLimitConfig.ip.hourMax);
      if (!ipHour.allowed) {
        return this.block(res, ip, `IP hour`, ipHour.retryAfterMs, sugerenciaId, contacto);
      }
    }

    // 3. Rate limit por contacto (si se proporciona)
    if (contacto) {
      const cLimit = this.rateLimit.hit(`voto:contacto:${contacto}`, rateLimitConfig.contacto.windowMs, rateLimitConfig.contacto.max);
      if (!cLimit.allowed) {
        return this.block(res, ip, `contacto`, cLimit.retryAfterMs, sugerenciaId, contacto);
      }
      if (rateLimitConfig.contacto.hourMax > 0) {
        const cHour = this.rateLimit.hit(
          `voto:contacto:hour:${contacto}`,
          rateLimitConfig.contacto.hourWindowMs,
          rateLimitConfig.contacto.hourMax,
        );
        if (!cHour.allowed) {
          return this.block(res, ip, `contacto hour`, cHour.retryAfterMs, sugerenciaId, contacto);
        }
      }
    }

    // Añadir headers informativos (útil para frontend)
    res.setHeader('X-RateLimit-IP-Remaining', String(ipLimit.remaining));
    if (contacto) {
      // No exponemos el contacto en header, solo genérico
      res.setHeader('X-RateLimit-Contact-Remaining', 'ok');
    }

    return true;
  }

  private getIp(req: Request): string {
    // Express con trust proxy: req.ip ya resuelve X-Forwarded-For
    // Fallback manual por si no está configurado
    const forwarded = (req.headers['x-forwarded-for'] as string) || '';
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return (req as any).ip || req.socket.remoteAddress || 'unknown';
  }

  private block(res: Response, ip: string, layer: string, retryAfterMs: number, sugerenciaId?: string, contacto?: string | null): never {
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    res.setHeader('Retry-After', String(retryAfterSec));
    // Sugerir al frontend que active CAPTCHA si está disponible (sin obligar)
    if (this.captcha.isEnabled()) {
      res.setHeader('X-Captcha-Required', 'true');
    }

    this.logger.warn(
      `Rate limit 429 bloqueado layer=${layer} ip=${ip} contacto=${contacto || '-'} sugerencia=${sugerenciaId || '-'} retryAfter=${retryAfterSec}s`,
    );

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: rateLimitConfig.message,
        error: 'Too Many Requests',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
