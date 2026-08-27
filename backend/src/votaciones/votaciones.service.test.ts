/**
 * Tests de concurrencia e idempotencia para VotacionesService.tryClose
 * Ejecuta con: npx ts-node src/votaciones/votaciones.service.test.ts
 * No requiere DB real, usa mocks que simulan el comportamiento transaccional de PostgreSQL.
 */

import { VotacionesService } from './votaciones.service';

// --- Mock Prisma que simula el estado real de la DB y el CAS atómico ---

function createMockPrisma(initial: {
  votacion: { id: string; estado: 'ACTIVA' | 'CERRADA'; ganadoraId: string | null; cierraAt: Date };
  sugerencias: Array<{ id: string; votacionId: string; estado: string; _count: { votos: number } }>;
}) {
  let votacion = { ...initial.votacion };
  let sugerencias = initial.sugerencias.map((s) => ({ ...s }));
  let notificationLogs: any[] = [];
  let txCounter = 0;

  // Simula el lock FOR UPDATE + CAS con un pequeño delay para forzar intercalado
  const prisma: any = {
    votacion: {
      findFirst: async (args: any) => (votacion.estado === 'ACTIVA' ? { ...votacion } : null),
      findMany: async (args: any) => (votacion.estado === 'ACTIVA' && votacion.cierraAt <= new Date() ? [{ id: votacion.id }] : []),
    },
    $transaction: async (fn: (tx: any) => Promise<any>) => {
      const txId = ++txCounter;
      // Cada transacción ve el estado actual al entrar, pero el CAS es atómico
      const tx = {
        $queryRaw: async (strings: any, ...values: any[]) => {
          // SELECT ... FOR UPDATE simula bloqueo: si ya está CERRADA, devuelve 0
          await new Promise((r) => setTimeout(r, 5)); // fuerza intercalado
          if (votacion.estado === 'ACTIVA') return [{ id: votacion.id }];
          return [];
        },
        sugerencia: {
          findMany: async (args: any) => {
            // Recalcula dentro de la transacción (fresco)
            return sugerencias.filter((s) => s.votacionId === votacion.id).map((s) => ({ ...s }));
          },
          updateMany: async (args: any) => {
            const target = sugerencias.find((s) => s.id === args.where.id && s.estado === 'PENDIENTE');
            if (target) {
              target.estado = 'GANADORA';
              return { count: 1 };
            }
            return { count: 0 };
          },
        },
        votacion: {
          updateMany: async (args: any) => {
            // CAS atómico: solo si sigue ACTIVA
            if (votacion.estado === 'ACTIVA' && args.where.id === votacion.id && args.where.estado === 'ACTIVA') {
              votacion.estado = 'CERRADA';
              votacion.ganadoraId = args.data.ganadoraId ?? null;
              return { count: 1 };
            }
            return { count: 0 };
          },
        },
        notificationLog: {
          create: async (args: any) => {
            notificationLogs.push(args.data);
            return args.data;
          },
        },
      };
      return fn(tx);
    },
    __getState: () => ({ votacion: { ...votacion }, sugerencias: sugerencias.map((s) => ({ ...s })), notificationLogs: [...notificationLogs] }),
  };
  return prisma;
}

async function run() {
  console.log('=== Test 1: Dos closeExpired concurrentes, solo uno debe ganar ===');
  {
    const prisma = createMockPrisma({
      votacion: { id: 'v1', estado: 'ACTIVA', ganadoraId: null, cierraAt: new Date(Date.now() - 1000) },
      sugerencias: [
        { id: 's1', votacionId: 'v1', estado: 'PENDIENTE', _count: { votos: 3 } },
        { id: 's2', votacionId: 'v1', estado: 'PENDIENTE', _count: { votos: 2 } },
        { id: 's3', votacionId: 'v1', estado: 'PENDIENTE', _count: { votos: 3 } }, // empate con s1, desempate por id -> s1 gana (s1 < s3)
      ],
    });
    const service = new VotacionesService(prisma as any);
    // Simula dos workers llamando closeExpired al mismo tiempo
    const [r1, r2] = await Promise.all([(service as any).tryClose('v1'), (service as any).tryClose('v1')]);
    const state = prisma.__getState();
    const successes = [r1, r2].filter((r) => r?.cerrada).length;
    console.log('Resultados:', r1, r2);
    console.log('Votacion estado:', state.votacion.estado, 'ganadoraId:', state.votacion.ganadoraId);
    console.log('Sugerencias:', state.sugerencias.map((s) => `${s.id}:${s.estado}(${s._count.votos})`).join(', '));
    console.log('NotificationLogs:', state.notificationLogs.length);

    if (successes !== 1) throw new Error(`Esperado 1 éxito, got ${successes}`);
    if (state.votacion.estado !== 'CERRADA') throw new Error('Votación debe quedar CERRADA');
    if (state.votacion.ganadoraId !== 's1') throw new Error(`Ganadora debe ser s1 por desempate id, got ${state.votacion.ganadoraId}`);
    if (state.notificationLogs.length !== 1) throw new Error(`Debe haber 1 NotificationLog, got ${state.notificationLogs.length}`);
    if (state.sugerencias.find((s) => s.id === 's1')?.estado !== 'GANADORA') throw new Error('s1 debe ser GANADORA');
    if (state.sugerencias.find((s) => s.id === 's2')?.estado !== 'PENDIENTE') throw new Error('s2 debe seguir PENDIENTE');
    console.log('✓ Test 1 PASÓ: solo un worker ganó, idempotente, sin duplicar log, ganadora dentro de votación y desempate por id respetado\n');
  }

  console.log('=== Test 2: Idempotencia - 3 retries secuenciales ===');
  {
    const prisma = createMockPrisma({
      votacion: { id: 'v2', estado: 'ACTIVA', ganadoraId: null, cierraAt: new Date(Date.now() - 1000) },
      sugerencias: [{ id: 'a1', votacionId: 'v2', estado: 'PENDIENTE', _count: { votos: 1 } }],
    });
    const service = new VotacionesService(prisma as any);
    const r1 = await (service as any).tryClose('v2');
    const r2 = await (service as any).tryClose('v2');
    const r3 = await (service as any).tryClose('v2');
    const state = prisma.__getState();
    console.log('r1', r1, 'r2', r2, 'r3', r3);
    console.log('Logs:', state.notificationLogs.length);
    if (!r1.cerrada || r2.cerrada || r3.cerrada) throw new Error('Solo primer retry debe cerrar');
    if (state.notificationLogs.length !== 1) throw new Error('No debe duplicar log en retries');
    if (state.votacion.ganadoraId !== 'a1') throw new Error('Ganadora no debe cambiar en retries');
    console.log('✓ Test 2 PASÓ: retries idempotentes\n');
  }

  console.log('=== Test 3: Votación sin sugerencias -> ganadora null pero CERRADA ===');
  {
    const prisma = createMockPrisma({
      votacion: { id: 'v3', estado: 'ACTIVA', ganadoraId: null, cierraAt: new Date(Date.now() - 1000) },
      sugerencias: [],
    });
    const service = new VotacionesService(prisma as any);
    const r = await (service as any).tryClose('v3');
    const state = prisma.__getState();
    console.log('Resultado:', r, 'estado:', state.votacion);
    if (!r.cerrada || r.ganadoraId !== null) throw new Error('Debe cerrar sin ganadora');
    if (state.votacion.estado !== 'CERRADA' || state.votacion.ganadoraId !== null) throw new Error('Estado incorrecto');
    if (state.notificationLogs.length !== 1) throw new Error('Debe crear log incluso sin ganadora');
    console.log('✓ Test 3 PASÓ\n');
  }

  console.log('=== Test 4: Votación ya CERRADA no se reabre ni cambia ganadora ===');
  {
    const prisma = createMockPrisma({
      votacion: { id: 'v4', estado: 'CERRADA', ganadoraId: 'old', cierraAt: new Date(Date.now() - 10000) },
      sugerencias: [{ id: 'x1', votacionId: 'v4', estado: 'GANADORA', _count: { votos: 10 } }],
    });
    const service = new VotacionesService(prisma as any);
    const r = await (service as any).tryClose('v4');
    const state = prisma.__getState();
    console.log('Resultado:', r);
    if (r.cerrada) throw new Error('No debe cerrar de nuevo');
    if (state.notificationLogs.length !== 0) throw new Error('No debe crear log si ya cerrada');
    if (state.votacion.ganadoraId !== 'old') throw new Error('Ganadora no debe modificarse');
    console.log('✓ Test 4 PASÓ\n');
  }

  console.log('=== Test 5: Votos frescos dentro de transacción (no stale) ===');
  {
    // Simula que entre findFirst externo y transacción llega un voto que cambia ganadora
    let votacion: any = { id: 'v5', estado: 'ACTIVA' as const, ganadoraId: null as string | null, cierraAt: new Date(Date.now() - 1000) };
    let sugerencias: any[] = [
      { id: 'sA', votacionId: 'v5', estado: 'PENDIENTE', _count: { votos: 2 } },
      { id: 'sB', votacionId: 'v5', estado: 'PENDIENTE', _count: { votos: 2 } },
    ];
    let logs: any[] = [];
    const prisma: any = {
      votacion: { findMany: async () => [{ id: 'v5' }] },
      $transaction: async (fn: any) => {
        const tx = {
          $queryRaw: async () => {
            // Antes de lock, simula que llega un voto tardío para sB (ahora 3)
            sugerencias.find((s) => s.id === 'sB')._count.votos = 3;
            return votacion.estado === 'ACTIVA' ? [{ id: 'v5' }] : [];
          },
          sugerencia: {
            findMany: async () => sugerencias.filter((s) => s.votacionId === 'v5').map((s) => ({ ...s })),
            updateMany: async (args: any) => {
              const t = sugerencias.find((s) => s.id === args.where.id && s.estado === 'PENDIENTE');
              if (t) { t.estado = 'GANADORA'; return { count: 1 }; }
              return { count: 0 };
            },
          },
          votacion: {
            updateMany: async (args: any) => {
              if (votacion.estado === 'ACTIVA') { votacion.estado = 'CERRADA'; votacion.ganadoraId = args.data.ganadoraId; return { count: 1 }; }
              return { count: 0 };
            },
          },
          notificationLog: { create: async (args: any) => { logs.push(args.data); return args.data; } },
        };
        return fn(tx);
      },
      __getState: () => ({ votacion, sugerencias, logs }),
    };
    const service = new VotacionesService(prisma as any);
    // Llamada antigua que hubiera usado suggestions stale [2,2] elegiría sA por id, pero dentro de tx debe ver [2,3] y elegir sB
    const staleSuggestions = [
      { id: 'sA', _count: { votos: 2 } },
      { id: 'sB', _count: { votos: 2 } },
    ];
    // Nuestra nueva implementación ignora staleSuggestions y recalcula dentro de tx, por eso debe ganar sB
    const r = await (service as any).tryClose('v5');
    console.log('Resultado:', r, 'ganadora:', r.ganadoraId);
    if (r.ganadoraId !== 'sB') throw new Error(`Debe ganar sB con voto fresco, got ${r.ganadoraId}`);
    console.log('✓ Test 5 PASÓ: conteo fresco dentro de transacción, no stale\n');
  }

  console.log('Todos los tests de concurrencia pasaron.');
}

run().catch((e) => {
  console.error('TEST FALLÓ:', e);
  process.exit(1);
});
