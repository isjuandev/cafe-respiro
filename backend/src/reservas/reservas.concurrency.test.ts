/**
 * Tests de carrera y autorización para ReservasService - garantiza que SUM(cantidad) <= cupoTotal
 * y que las cancelaciones liberen cupos de forma segura.
 *
 * Ejecuta con: npx ts-node src/reservas/reservas.concurrency.test.ts
 */

import { ReservasService } from './reservas.service';
import { Prisma, ReservaEstado } from '@prisma/client';

// Mock Prisma que simula Postgres FOR UPDATE + aggregate dentro de transacción
function createMockPrisma(initial: {
  funcion: { id: string; cupoTotal: number; fechaHora: Date };
  reservas: Array<{
    id?: string;
    funcionId: string;
    contacto: string;
    cantidad: number;
    nombre?: string;
    estado?: ReservaEstado;
    expiraEn?: Date;
  }>;
}) {
  let funcion = { ...initial.funcion };
  let reservas = initial.reservas.map((r, i) => ({
    id: r.id || `res-init-${i}`,
    codigo: `CIN-TEST${i}`,
    nombre: r.nombre || 'Cliente',
    total: r.cantidad * 15000,
    estado: r.estado || ReservaEstado.CONFIRMADA,
    expiraEn: r.expiraEn || new Date(Date.now() + 3600000),
    items: [],
    ...r,
  }));
  let notificationCalls: any[] = [];

  let lock = false;
  const waitQueue: Array<() => void> = [];

  async function acquireLock() {
    if (!lock) {
      lock = true;
      return;
    }
    await new Promise<void>((resolve) => waitQueue.push(resolve));
    lock = true;
  }
  function releaseLock() {
    if (waitQueue.length > 0) {
      lock = false;
      const next = waitQueue.shift()!;
      next();
    } else {
      lock = false;
    }
  }

  const prisma: any = {
    tipoEntrada: {
      findMany: async () => [
        { id: 'tipo_esencial', nombre: 'Esencial', precio: 15000, activo: true, orden: 1 },
      ],
      findFirst: async () => ({
        id: 'tipo_esencial',
        nombre: 'Esencial',
        precio: 15000,
        activo: true,
        orden: 1,
      }),
      create: async (args: any) => ({
        id: 'tipo_esencial',
        ...args.data,
      }),
    },
    funcion: {
      findUnique: async ({ where }: any) => {
        if (where.id === funcion.id)
          return { ...funcion, pelicula: { id: 'pel-1', titulo: 'Test' } };
        return null;
      },
    },
    reserva: {
      findUnique: async ({ where }: any) => {
        const found = reservas.find((r) => r.id === where.id || r.codigo === where.codigo);
        if (!found) return null;
        return {
          ...found,
          funcion: { ...funcion, pelicula: { id: 'pel-1', titulo: 'Test' } },
        };
      },
      update: async ({ where, data }: any) => {
        const found = reservas.find((r) => r.id === where.id);
        if (!found) throw new Error('Not found');
        Object.assign(found, data);
        return {
          ...found,
          funcion: { ...funcion, pelicula: { id: 'pel-1', titulo: 'Test' } },
          items: [],
        };
      },
    },
    notificationLog: {
      create: async (data: any) => {
        notificationCalls.push(data);
        return { id: 'log-1', ...data };
      },
    },
    $transaction: async (fn: (tx: any) => Promise<any>) => {
      await acquireLock();
      const snapReservas = reservas.map((r) => ({ ...r }));
      const tx: any = {
        $queryRaw: async (strings: any, ...values: any[]) => {
          await new Promise((r) => setTimeout(r, 5));
          if (funcion.id === values[0] || funcion.id === 'func-1') {
            return [
              {
                id: funcion.id,
                cupoTotal: funcion.cupoTotal,
                fechaHora: funcion.fechaHora,
              },
            ];
          }
          return [];
        },
        reserva: {
          findFirst: async ({ where }: any) => {
            return (
              reservas.find(
                (r) =>
                  r.funcionId === where.funcionId &&
                  r.contacto === where.contacto &&
                  (where.estado ? r.estado === where.estado : true)
              ) || null
            );
          },
          findUnique: async ({ where }: any) => {
            return reservas.find((r) => r.codigo === where.codigo) || null;
          },
          update: async ({ where, data }: any) => {
            const found = reservas.find((r) => r.id === where.id);
            if (found) Object.assign(found, data);
            return found;
          },
          aggregate: async ({ where }: any) => {
            const sum = reservas
              .filter((r) => r.funcionId === where.funcionId && r.estado !== ReservaEstado.CANCELADA)
              .reduce((acc, r) => acc + r.cantidad, 0);
            return { _sum: { cantidad: sum || null } };
          },
          create: async ({ data }: any) => {
            const newReserva = {
              id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
              ...data,
              items: [
                {
                  tipoEntrada: { nombre: 'Esencial' },
                  cantidad: data.cantidad,
                  precioUnitario: 15000,
                  subtotal: data.total,
                },
              ],
              funcion: { id: funcion.id, fechaHora: funcion.fechaHora, pelicula: { titulo: 'Test' } },
            };
            reservas.push(newReserva);
            return newReserva;
          },
        },
      };

      try {
        const res = await fn(tx);
        return res;
      } catch (e) {
        reservas = snapReservas;
        throw e;
      } finally {
        releaseLock();
      }
    },
    __getState: () => ({
      funcion: { ...funcion },
      reservas: reservas.map((r) => ({ ...r })),
      notificationCalls: [...notificationCalls],
    }),
    __addNotification: (n: any) => notificationCalls.push(n),
  };

  return prisma;
}

function createMockNotifications(prisma: any) {
  return {
    notifyReservaRegistrada: async (reserva: any, funcion: any) => {
      prisma.__addNotification({ tipo: 'REGISTRADA', reserva, funcion });
    },
    notifyPagoConfirmado: async (reserva: any, funcion: any) => {
      prisma.__addNotification({ tipo: 'PAGO_CONFIRMADO', reserva, funcion });
    },
    notifyReservaConfirmada: async (reserva: any, funcion: any) => {
      prisma.__addNotification({ tipo: 'CONFIRMADA', reserva, funcion });
    },
  } as any;
}

function createMockConfigPago() {
  return {
    getConfiguracion: async () => ({
      banco: 'Bancolombia',
      tipoCuenta: 'Ahorros',
      numeroCuenta: '123-456789-01',
      titular: 'Café Respiro',
      telefonoWp: '573001234567',
    }),
  } as any;
}

async function run() {
  console.log(
    '=== Test 1: Cupo restante 2, A=2 y B=2 concurrentes, solo uno debe ganar, nunca 4 ==='
  );
  {
    const future = new Date(Date.now() + 86400000);
    const prisma = createMockPrisma({
      funcion: { id: 'func-1', cupoTotal: 15, fechaHora: future },
      reservas: [
        { funcionId: 'func-1', contacto: 'exist1@test.com', cantidad: 7 },
        { funcionId: 'func-1', contacto: 'exist2@test.com', cantidad: 6 },
      ],
    });
    const notifications = createMockNotifications(prisma);
    const configPago = createMockConfigPago();
    const service = new ReservasService(prisma as any, notifications, configPago);

    const reqA = service.reservar(
      'func-1',
      { cantidad: 2, contacto: 'alice@test.com', nombre: 'Alice' },
      null
    );
    const reqB = service.reservar(
      'func-1',
      { cantidad: 2, contacto: 'bob@test.com', nombre: 'Bob' },
      null
    );

    const results = await Promise.allSettled([reqA, reqB]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled') as any[];
    const rejected = results.filter((r) => r.status === 'rejected') as any[];

    const state = prisma.__getState();
    const total = state.reservas.reduce((acc: number, r: any) => acc + r.cantidad, 0);

    console.log('Fulfilled:', fulfilled.length, 'Rejected:', rejected.length);
    console.log('Rechazado mensaje:', rejected[0]?.reason?.message);
    console.log('Total reservas cantidad:', total, 'cupoTotal:', state.funcion.cupoTotal);

    if (fulfilled.length !== 1 || rejected.length !== 1)
      throw new Error(`Debe ganar 1 y fallar 1, got ${fulfilled.length}/${rejected.length}`);
    if (total > 15) throw new Error(`Overselling! total ${total} > 15`);
    if (total !== 15) throw new Error(`Total debe ser 15 (13+2), got ${total}`);
    if (!rejected[0].reason.message.includes('Cupo'))
      throw new Error('Rechazo debe ser por cupo lleno');
    console.log('✓ Test 1 PASÓ: No overselling, rollback correcto, concurrencia segura\n');
  }

  console.log('=== Test 2: Cupo restante 2, A=1 y B=1 concurrentes, ambos deben ganar (total 15) ===');
  {
    const future = new Date(Date.now() + 86400000);
    const prisma = createMockPrisma({
      funcion: { id: 'func-1', cupoTotal: 15, fechaHora: future },
      reservas: [{ funcionId: 'func-1', contacto: 'a@test.com', cantidad: 13 }],
    });
    const service = new ReservasService(
      prisma as any,
      createMockNotifications(prisma),
      createMockConfigPago()
    );
    const results = await Promise.allSettled([
      service.reservar('func-1', { cantidad: 1, contacto: 'x@test.com', nombre: 'A' }, null),
      service.reservar('func-1', { cantidad: 1, contacto: 'y@test.com', nombre: 'B' }, null),
    ]);
    const state = prisma.__getState();
    const total = state.reservas.reduce((acc: number, r: any) => acc + r.cantidad, 0);
    console.log('Total:', total, 'Results:', results.map((r) => r.status));
    if (results.some((r) => r.status === 'rejected'))
      throw new Error('Ambos 1+1 con cupo 2 deben ganar');
    if (total !== 15) throw new Error(`Total debe ser 15, got ${total}`);
    console.log('✓ Test 2 PASÓ: 1+1 con cupo 2 permite ambos sin oversell\n');
  }

  console.log('=== Test 3: Idempotencia mismo contacto con reserva pendiente activa ===');
  {
    const future = new Date(Date.now() + 86400000);
    const prisma = createMockPrisma({
      funcion: { id: 'func-1', cupoTotal: 15, fechaHora: future },
      reservas: [],
    });
    const service = new ReservasService(
      prisma as any,
      createMockNotifications(prisma),
      createMockConfigPago()
    );
    const r1 = await service.reservar(
      'func-1',
      { cantidad: 2, contacto: 'ana@test.com', nombre: 'Ana' },
      null
    );
    console.log('Primera reserva OK, codigo:', r1.reserva.codigo);
    try {
      await service.reservar(
        'func-1',
        { cantidad: 2, contacto: 'ana@test.com', nombre: 'Ana' },
        null
      );
      throw new Error('Segunda con mismo contacto debe fallar');
    } catch (e: any) {
      if (!e.message.includes('Ya tienes una reserva pendiente'))
        throw new Error(`Mensaje incorrecto: ${e.message}`);
      console.log('✓ Segunda rechazada correctamente:', e.message);
    }
    const state = prisma.__getState();
    if (state.reservas.length !== 1) throw new Error('No debe duplicar reserva');
    console.log('✓ Test 3 PASÓ: idempotencia y prevención de acumulación pendiente\n');
  }

  console.log('=== Test 4: Cancelación exitosa y liberación de cupos ===');
  {
    const future = new Date(Date.now() + 86400000);
    const prisma = createMockPrisma({
      funcion: { id: 'func-1', cupoTotal: 15, fechaHora: future },
      reservas: [
        {
          id: 'res-cancel-1',
          funcionId: 'func-1',
          contacto: 'cancel@test.com',
          cantidad: 3,
          estado: ReservaEstado.PENDIENTE_PAGO,
        },
        {
          id: 'res-cancel-confirmed',
          funcionId: 'func-1',
          contacto: 'confirmed@test.com',
          cantidad: 2,
          estado: ReservaEstado.CONFIRMADA,
        },
      ],
    });
    const service = new ReservasService(
      prisma as any,
      createMockNotifications(prisma),
      createMockConfigPago()
    );

    // 1. Intento de cancelar por otro usuario no admin (debe ser Forbidden)
    try {
      await service.cancelar('res-cancel-1', { contacto: 'otro@test.com', role: 'cliente' });
      throw new Error('Usuario no autorizado no debe poder cancelar reserva ajena');
    } catch (e: any) {
      if (!e.message.includes('No tienes permiso')) throw e;
      console.log('✓ Rechazado intento de cancelación ajena (403 Forbidden)');
    }

    // 2. Intento de cancelar reserva ya confirmada/pagada por el cliente (debe ser Conflict)
    try {
      await service.cancelar('res-cancel-confirmed', {
        contacto: 'confirmed@test.com',
        role: 'cliente',
      });
      throw new Error('Cliente no debe poder cancelar reserva pagada/confirmada');
    } catch (e: any) {
      if (!e.message.includes('No puedes cancelar una reserva que ya ha sido pagada')) throw e;
      console.log('✓ Rechazado intento de cancelación de reserva confirmada/pagada (409 Conflict)');
    }

    // 3. Cancelación legítima de reserva pendiente por el dueño de la reserva
    const cancelRes = await service.cancelar('res-cancel-1', {
      contacto: 'cancel@test.com',
      role: 'cliente',
    });
    console.log('✓ Cancelación exitosa de reserva pendiente:', cancelRes.message, 'Cupos liberados:', cancelRes.cuposLiberados);

    // 4. Cancelación administrativa de reserva confirmada permitida para staff
    const adminCancelRes = await service.cancelar('res-cancel-confirmed', {
      role: 'admin',
    });
    console.log('✓ Admin puede cancelar reserva confirmada:', adminCancelRes.message);

    const state = prisma.__getState();
    const resRow = state.reservas.find((r: any) => r.id === 'res-cancel-1');
    if (resRow?.estado !== ReservaEstado.CANCELADA) throw new Error('La reserva debe ser marcada como CANCELADA');
    console.log('✓ Test 4 PASÓ: reglas de cancelación y bloqueo de reservas pagadas validadas\n');
  }

  console.log('Todos los tests de carrera y cancelación de reservas PASARON.');
}

run().catch((e) => {
  console.error('TEST FALLÓ:', e);
  process.exit(1);
});
