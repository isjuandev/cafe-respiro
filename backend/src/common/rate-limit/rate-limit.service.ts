import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Rate limiter en memoria, sin Redis.
 * - Ventana fija (fixed window) con reset.
 * - LRU implícito vía limpieza periódica.
 * - Suficiente para 1 instancia. Para múltiples instancias, cada una limita localmente;
 *   el costo de un atacante distribuido sigue alto y la DB es la autoridad final (409).
 * - No bloquea NAT injustamente si se configura IP generoso.
 */
@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly buckets = new Map<string, Bucket>();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor() {
    // Limpieza cada 5 minutos para evitar memory leak
    this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    this.cleanupTimer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }

  /**
   * Intenta consumir 1 token para la clave.
   * @returns { allowed, remaining, resetAt, retryAfterMs }
   */
  hit(key: string, windowMs: number, max: number): { allowed: boolean; remaining: number; resetAt: number; retryAfterMs: number } {
    if (max <= 0) {
      return { allowed: true, remaining: Infinity, resetAt: 0, retryAfterMs: 0 };
    }

    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
      return { allowed: true, remaining: max - 1, resetAt: bucket.resetAt, retryAfterMs: 0 };
    }

    if (bucket.count < max) {
      bucket.count += 1;
      return { allowed: true, remaining: max - bucket.count, resetAt: bucket.resetAt, retryAfterMs: 0 };
    }

    const retryAfterMs = bucket.resetAt - now;
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt, retryAfterMs };
  }

  /**
   * Verifica sin consumir (para métricas).
   */
  peek(key: string): Bucket | undefined {
    return this.buckets.get(key);
  }

  private cleanup() {
    const now = Date.now();
    let removed = 0;
    for (const [key, bucket] of this.buckets.entries()) {
      if (now >= bucket.resetAt) {
        this.buckets.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      this.logger.debug(`RateLimit cleanup: ${removed} buckets expirados eliminados, ${this.buckets.size} activos`);
    }
  }

  // Para tests: resetear estado
  clear() {
    this.buckets.clear();
  }

  size(): number {
    return this.buckets.size;
  }
}
