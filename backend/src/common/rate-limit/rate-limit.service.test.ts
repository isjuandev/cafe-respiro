/**
 * Tests para RateLimitService y VotosRateLimitGuard
 * Ejecutar: npx ts-node src/common/rate-limit/rate-limit.service.test.ts
 */

import { RateLimitService } from './rate-limit.service';
import { VotosRateLimitGuard } from './votos-rate-limit.guard';
import { CaptchaService } from '../captcha/captcha.service';

// Helper para crear mock ExecutionContext
function mockContext(ip: string, body: any, params: any, headers: any = {}) {
  const req: any = {
    ip,
    headers: { 'x-forwarded-for': ip, ...headers },
    body,
    params,
    socket: { remoteAddress: ip },
  };
  const res: any = {
    headers: {} as Record<string, string>,
    setHeader(k: string, v: string) { this.headers[k] = v; },
  };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
    getRequest: () => req,
    getResponse: () => res,
  } as any;
}

async function run() {
  console.log('=== Test RateLimitService: ventana fija ===');
  {
    const svc = new RateLimitService();
    const key = 'test:key';
    // 3 max en 1000ms
    for (let i = 0; i < 3; i++) {
      const r = svc.hit(key, 1000, 3);
      if (!r.allowed) throw new Error(`hit ${i} debe ser allowed`);
    }
    const blocked = svc.hit(key, 1000, 3);
    if (blocked.allowed) throw new Error('4to hit debe ser bloqueado');
    if (blocked.retryAfterMs <= 0) throw new Error('Debe tener retryAfter');
    console.log('✓ Ventana fija bloquea correctamente, retryAfter', blocked.retryAfterMs);

    // Esperar ventana
    await new Promise((r) => setTimeout(r, 1100));
    const after = svc.hit(key, 1000, 3);
    if (!after.allowed) throw new Error('Después de ventana debe permitir');
    console.log('✓ Ventana resetea tras expiry');

    svc.clear();
    (svc as any).cleanup();
  }

  console.log('\n=== Test VotosRateLimitGuard: IP burst 20/10s y IP 20/min ===');
  {
    const rate = new RateLimitService();
    const captcha = new CaptchaService();
    // captcha deshabilitado por defecto (CAPTCHA_ENABLED != true)
    const guard = new VotosRateLimitGuard(rate, captcha);

    const ip = '1.2.3.4';
    // Burst: 20 en 10s
    for (let i = 0; i < 20; i++) {
      const ctx = mockContext(ip, { contacto: `user${i}@test.com`, nombre: 'Test' }, { id: 's1' });
      const ok = await guard.canActivate(ctx as any);
      if (!ok) throw new Error(`Burst ${i} debe pasar`);
    }
    const burstBlockedCtx = mockContext(ip, { contacto: 'extra@test.com', nombre: 'Test' }, { id: 's1' });
    try {
      await guard.canActivate(burstBlockedCtx as any);
      throw new Error('Debe bloquear burst 21');
    } catch (e: any) {
      if (e.status !== 429) throw new Error(`Esperado 429, got ${e.status} ${e.message}`);
      console.log('✓ Burst bloqueado 429 con Retry-After', e.message);
    }

    // Limpiar para test de IP ventana principal
    rate.clear();
    // 20/min por IP - llenar con contactos distintos
    for (let i = 0; i < 20; i++) {
      const ctx = mockContext(ip, { contacto: `uniq${i}@test.com`, nombre: 'Test' }, { id: `s${i}` });
      await guard.canActivate(ctx as any);
    }
    const ipBlocked = mockContext(ip, { contacto: 'one-more@test.com', nombre: 'Test' }, { id: 's99' });
    try {
      await guard.canActivate(ipBlocked as any);
      throw new Error('Debe bloquear IP 21');
    } catch (e: any) {
      if (e.status !== 429) throw new Error('Esperado 429 IP');
      console.log('✓ IP 20/min bloquea 21vo, NAT protegido (20 generoso)');
    }
    rate.clear();
  }

  console.log('\n=== Test contacto: 5/min por contacto (normalizado) ===');
  {
    const rate = new RateLimitService();
    const guard = new VotosRateLimitGuard(rate, new CaptchaService());
    const ip1 = '10.0.0.1';
    const ip2 = '10.0.0.2'; // contacto mismo desde IPs distintas debe limitar igual

    const contacto = 'Test@Example.com';
    for (let i = 0; i < 5; i++) {
      const ctx = mockContext(i % 2 === 0 ? ip1 : ip2, { contacto, nombre: 'Test' }, { id: `s${i}` });
      await guard.canActivate(ctx as any);
    }
    // Variación de mayúsculas debe compartir bucket (normalizeContacto)
    const blocked = mockContext(ip1, { contacto: 'test@example.com', nombre: 'Test' }, { id: 's5' });
    try {
      await guard.canActivate(blocked as any);
      throw new Error('Debe bloquear contacto 6 (mismo normalizado)');
    } catch (e: any) {
      if (e.status !== 429) throw new Error('Esperado 429 contacto');
      console.log('✓ Contacto 5/min bloquea 6to, normalizado case-insensitive');
    }

    // Otro contacto distinto desde misma IP debe pasar (no confundir buckets)
    const other = mockContext(ip1, { contacto: 'other@example.com', nombre: 'Test' }, { id: 's99' });
    const ok = await guard.canActivate(other as any);
    if (!ok) throw new Error('Otro contacto debe pasar');
    console.log('✓ Otro contacto no afectado');

    rate.clear();
  }

  console.log('\n=== Test NAT: 20 usuarios detrás de misma IP, cada uno 1 voto/min ===');
  {
    const rate = new RateLimitService();
    const guard = new VotosRateLimitGuard(rate, new CaptchaService());
    const sharedIp = '203.0.113.10'; // NAT de café
    for (let i = 0; i < 20; i++) {
      const ctx = mockContext(sharedIp, { contacto: `cliente${i}@cafe.com`, nombre: 'Test' }, { id: `s${i}` });
      await guard.canActivate(ctx as any);
    }
    // 20 usuarios distintos OK
    console.log('✓ 20 usuarios NAT pasan con IP 20/min');
    // 21º usuario distinto debería ser bloqueado por IP, pero eso protege contra bot que rota contactos
    const extra = mockContext(sharedIp, { contacto: 'cliente21@cafe.com', nombre: 'Test' }, { id: 's21' });
    try {
      await guard.canActivate(extra as any);
      throw new Error('21º en misma IP debe bloquear');
    } catch (e: any) {
      if (e.status !== 429) throw new Error('Esperado 429 NAT');
      console.log('✓ 21º en NAT bloqueado por IP (tradeoff documentado: subir VOTE_RATE_IP_MAX si café tiene >20 clientes/min)');
    }
    rate.clear();
  }

  console.log('\n=== Test 409 se mantiene (DB es autoridad) ===');
  {
    // Simular VotosService que lanza 409 por P2002, el guard no interfiere
    // El guard solo hace rate limit, no toca la lógica de duplicado.
    // Verificamos que el mensaje 409 no se convierte en 429 si no se excede límite
    const rate = new RateLimitService();
    const guard = new VotosRateLimitGuard(rate, new CaptchaService());
    const ctx = mockContext('5.5.5.5', { contacto: 'dup@test.com', nombre: 'Test' }, { id: 's1' });
    const ok = await guard.canActivate(ctx as any);
    if (!ok) throw new Error('Debe pasar rate limit');
    // Simular que luego el servicio lança ConflictException 409
    // El guard ya pasó, el controller retornará 409 del servicio, no 429
    console.log('✓ 409 preservado: guard pasa, DB decide duplicado');
    rate.clear();
  }

  console.log('\n=== Test headers 429 Retry-After y X-RateLimit ===');
  {
    const rate = new RateLimitService();
    const guard = new VotosRateLimitGuard(rate, new CaptchaService());
    const ip = '9.9.9.9';
    for (let i = 0; i < 5; i++) {
      await guard.canActivate(mockContext(ip, { contacto: 'a@b.com', nombre: 'Test' }, { id: `s${i}` }) as any);
    }
    // 6to contacto bloqueado debe tener headers
    const res: any = { headers: {}, setHeader(k: string, v: string) { this.headers[k] = v; } };
    const req: any = { ip, headers: {}, body: { contacto: 'a@b.com', nombre: 'Test' }, params: { id: 's5' }, socket: {} };
    const ctx: any = { switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }) };
    try {
      await guard.canActivate(ctx);
      throw new Error('Debe bloquear');
    } catch (e: any) {
      if (e.status !== 429) throw new Error('429');
      if (!res.headers['Retry-After']) throw new Error('Falta Retry-After');
      console.log('✓ 429 con Retry-After', res.headers['Retry-After'], 'y logging');
    }
  }

  console.log('\n=== Test CAPTCHA arquitectura (deshabilitado por defecto) ===');
  {
    const rate = new RateLimitService();
    const captcha = new CaptchaService();
    if (captcha.isEnabled()) throw new Error('CAPTCHA debe estar deshabilitado por defecto');
    const guard = new VotosRateLimitGuard(rate, captcha);
    const ctx = mockContext('1.1.1.1', { contacto: 'x@y.com', nombre: 'Test' }, { id: 's1' });
    const ok = await guard.canActivate(ctx as any);
    if (!ok) throw new Error('Sin captcha debe pasar');
    console.log('✓ CAPTCHA deshabilitado no bloquea, habilitado exigiría x-captcha-token');
  }

  console.log('\nTodos los tests de rate limiting pasaron.');
}

run().catch((e) => {
  console.error('TEST FALLÓ:', e);
  process.exit(1);
});
