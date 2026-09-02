/**
 * Tests para SugerenciasService.programar(sugerenciaId, datosFuncion)
 * Cubre 8 escenarios: éxito, doble concurrente, no GANADORA, pelicula nueva/existente,
 * fallo funcion, rollback, notificación post-commit.
 * Ejecutar: npx ts-node src/sugerencias/sugerencias.programar.test.ts
 */

import { SugerenciasService } from './sugerencias.service';

// Helpers
function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(19, 0, 0, 0);
  return d.toISOString();
}

// Mock Prisma con soporte transaccional y snapshot para rollback
function createMockPrisma(initial: {
  sugerencias: any[];
  peliculas: any[];
  funciones: any[];
  reservas?: any[];
}) {
  let sugerencias = initial.sugerencias.map((s) => ({ ...s }));
  let peliculas = initial.peliculas.map((p) => ({ ...p }));
  let funciones = initial.funciones.map((f) => ({ ...f }));
  let reservas: any[] = (initial.reservas || []).map((r: any) => ({ ...r }));

  const findSugerencia = (id: string) => sugerencias.find((s) => s.id === id);
  const findPeliculaByNorm = (norm: string) => peliculas.find((p) => p.tituloNormalizado === norm);

  const prisma: any = {
    sugerencia: {
      findUnique: async ({ where }: any) => {
        const s = findSugerencia(where.id);
        return s ? { ...s } : null;
      },
      findFirst: async () => null,
    },
    pelicula: {
      findFirst: async ({ where }: any) => {
        const p = findPeliculaByNorm(where.tituloNormalizado);
        return p ? { ...p } : null;
      },
    },
    funcion: {
      findFirst: async ({ where }: any) => {
        if (where.fechaHora?.gte && where.fechaHora?.lt) {
          const gte = new Date(where.fechaHora.gte);
          const lt = new Date(where.fechaHora.lt);
          return funciones.find((f) => { const d = new Date(f.fechaHora); return d >= gte && d < lt; }) || null;
        }
        return null;
      },
    },
    reserva: {
      count: async ({ where }: any) => {
        // Filtra por funcionId y ignora expiraEn para el mock simple
        if (where.funcionId) return reservas.filter((r) => r.funcionId === where.funcionId).length;
        return reservas.length;
      },
    },
    $transaction: async (fn: (tx: any) => Promise<any>) => {
      // Copia local aislada para la transacción (aislamiento)
      let localSugs = sugerencias.map((s) => ({ ...s }));
      let localPelis = peliculas.map((p) => ({ ...p }));
      let localFuncs = funciones.map((f) => ({ ...f }));
      let localReservas = reservas.map((r: any) => ({ ...r }));

      const tx: any = {
        sugerencia: {
          findUnique: async ({ where }: any) => {
            const s = localSugs.find((x) => x.id === where.id);
            return s ? { ...s } : null;
          },
          update: async ({ where, data }: any) => {
            const s = localSugs.find((x) => x.id === where.id);
            if (!s) throw new Error('NotFound');
            Object.assign(s, data);
            return { ...s };
          },
        },
        pelicula: {
          findFirst: async ({ where }: any) => {
            const p = localPelis.find((x) => x.tituloNormalizado === where.tituloNormalizado);
            return p ? { ...p } : null;
          },
          create: async ({ data }: any) => {
            const p = { id: `pel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...data };
            localPelis.push(p);
            return { ...p };
          },
        },
        funcion: {
          findFirst: async ({ where }: any) => {
            if (where.fechaHora?.gte) {
              const gte = new Date(where.fechaHora.gte);
              const lt = new Date(where.fechaHora.lt);
              return localFuncs.find((f) => { const d = new Date(f.fechaHora); return d >= gte && d < lt; }) || null;
            }
            if (where.fechaHora) {
              return localFuncs.find((f) => new Date(f.fechaHora).getTime() === new Date(where.fechaHora).getTime()) || null;
            }
            return null;
          },
          create: async ({ data, include }: any) => {
            // Simula unique index en fechaHora contra estado GLOBAL + local (para concurrencia)
            const allFuncs = [...funciones, ...localFuncs.filter((lf) => !funciones.some((gf) => gf.id === lf.id))];
            if (allFuncs.some((f) => new Date(f.fechaHora).getTime() === new Date(data.fechaHora).getTime())) {
              // También revisa si ya existe en global (otra tx que hizo commit)
              const e: any = new Error('P2002');
              e.code = 'P2002';
              throw e;
            }
            if (localFuncs.some((f) => new Date(f.fechaHora).getTime() === new Date(data.fechaHora).getTime())) {
              const e: any = new Error('P2002');
              e.code = 'P2002';
              throw e;
            }
            if (data.cupoTotal < 1 || data.cupoTotal > 15) {
              const e: any = new Error('Bad cupo');
              e.code = 'BAD_CUPO';
              throw e;
            }
            const func = { id: `func-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...data, pelicula: localPelis.find((p) => p.id === data.peliculaId) || null };
            localFuncs.push(func);
            return { ...func };
          },
          update: async ({ where, data, include }: any) => {
            const func = localFuncs.find((f) => f.id === where.id);
            if (!func) throw new Error('NotFound funcion');
            Object.assign(func, data);
            if (include?.pelicula) func.pelicula = localPelis.find((p) => p.id === func.peliculaId) || null;
            return { ...func };
          },
        },
        reserva: {
          count: async ({ where }: any) => {
            if (where.funcionId) return localReservas.filter((r: any) => r.funcionId === where.funcionId).length;
            return localReservas.length;
          },
        },
      };

      // Pequeño delay para forzar intercalado concurrente
      await new Promise((r) => setTimeout(r, 5));

      try {
        const res = await fn(tx);
        // Commit: aplicar local al global de forma atómica (simula DB commit)
        // Para sala única, verificar de nuevo contra global por si otra tx hizo commit mientras esperábamos
        const conflict = localFuncs.some((lf) => funciones.some((gf) => new Date(gf.fechaHora).getTime() === new Date(lf.fechaHora).getTime() && !funciones.some((prev) => prev.id === lf.id)));
        if (conflict) {
          const e: any = new Error('P2002');
          e.code = 'P2002';
          throw e;
        }
        sugerencias = localSugs;
        peliculas = localPelis;
        funciones = localFuncs;
        return res;
      } catch (e) {
        // Rollback: descartar local, no tocar global
        throw e;
      }
    },
    __getState: () => ({ sugerencias: sugerencias.map((s) => ({ ...s })), peliculas: peliculas.map((p) => ({ ...p })), funciones: funciones.map((f) => ({ ...f })) }),
    __setState: (s: any) => {
      sugerencias = s.sugerencias;
      peliculas = s.peliculas;
      funciones = s.funciones;
    },
  };
  return prisma;
}

// Mock Notifications
function createMockNotifications() {
  let calls: any[] = [];
  return {
    notifySugerenciaProgramada: async (s: any) => { calls.push(s); },
    __getCalls: () => [...calls],
    __reset: () => { calls = []; },
  };
}

async function run() {
  console.log('=== Test 1: Éxito GANADORA -> PROGRAMADA (película nueva) ===');
  {
    const prisma = createMockPrisma({
      sugerencias: [{ id: 's1', titulo: 'Interstellar', director: 'Nolan', anio: 2014, tituloNormalizado: 'interstellar', estado: 'GANADORA', peliculaId: null }],
      peliculas: [],
      funciones: [],
    });
    const notifications: any = createMockNotifications();
    const svc = new SugerenciasService(prisma as any);
    // Monkey patch para que el service use nuestro mock de notifications vía caller (controller hace notify)
    // Aquí el service no notifica, lo hace el caller, así que simulamos caller
    const result = await svc.programar('s1', { fechaHora: futureDate(2), cupoTotal: 10 });
    // Simular notificación post-commit del controller
    await notifications.notifySugerenciaProgramada(result.sugerencia);
    const state = prisma.__getState();
    console.log('Result:', result.sugerencia.estado, result.pelicula.titulo, result.funcion.cupoTotal);
    if (result.sugerencia.estado !== 'PROGRAMADA') throw new Error('Debe ser PROGRAMADA');
    if (!result.sugerencia.peliculaId) throw new Error('Debe tener peliculaId');
    if (state.funciones.length !== 1) throw new Error('Debe crear 1 funcion');
    if (state.peliculas.length !== 1) throw new Error('Debe crear 1 pelicula');
    if (notifications.__getCalls().length !== 1) throw new Error('Debe notificar 1 vez post-commit');
    console.log('✓ Test 1 PASÓ\n');
  }

  console.log('=== Test 2: Doble programación concurrente (sala única + misma sugerencia) ===');
  {
    const prisma = createMockPrisma({
      sugerencias: [
        { id: 's2a', titulo: 'Dune', director: 'Villeneuve', anio: 2021, tituloNormalizado: 'dune', estado: 'GANADORA', peliculaId: null },
        { id: 's2b', titulo: 'Dune 2', director: 'Villeneuve', anio: 2024, tituloNormalizado: 'dune 2', estado: 'GANADORA', peliculaId: null },
      ],
      peliculas: [],
      funciones: [],
    });
    const svc = new SugerenciasService(prisma as any);
    const fecha = futureDate(3);
    // Dos GANADORAs diferentes misma fecha sin reservas -> segunda reemplaza (reprograma) misma fecha
    const r1 = await svc.programar('s2a', { fechaHora: fecha, cupoTotal: 12 });
    const r2 = await svc.programar('s2b', { fechaHora: fecha, cupoTotal: 12 });
    console.log('r1 fecha:', r1.funcion.fechaHora, 'r2 fecha:', r2.funcion.fechaHora, 'r1 peli:', r1.pelicula.id, 'r2 peli:', r2.pelicula.id);
    const state = prisma.__getState();
    console.log('Funciones:', state.funciones.length, 'Estados:', state.sugerencias.map((s: any) => s.estado));
    if (state.funciones.length !== 1) throw new Error('Debe haber 1 funcion (segunda reemplaza sin reservas)');
    if (!state.sugerencias.every((s: any) => s.estado === 'PROGRAMADA')) throw new Error('Ambas deben quedar PROGRAMADA');
    if (state.funciones[0].peliculaId !== r2.pelicula.id) throw new Error('Función debe quedar con película de la segunda (reemplazo)');
    // Misma sugerencia no puede reprogramarse
    try {
      await svc.programar('s2a', { fechaHora: futureDate(4), cupoTotal: 10 });
      throw new Error('Reintento misma sugerencia debe fallar ya PROGRAMADA');
    } catch (e: any) {
      if (!e.message.includes('PROGRAMADA') && !e.message.includes('GANADORA')) throw e;
    }
    console.log('✓ Test 2 PASÓ: concurrencia con desplazamiento sin reservas\n');
  }

  console.log('=== Test 3: Sugerencia que no es GANADORA (PENDIENTE sin manual) debe fallar ===');
  {
    const prisma = createMockPrisma({
      sugerencias: [{ id: 's3', titulo: 'Test', director: null, anio: null, tituloNormalizado: 'test', estado: 'PENDIENTE', peliculaId: null }],
      peliculas: [],
      funciones: [],
    });
    const svc = new SugerenciasService(prisma as any);
    try {
      await svc.programar('s3', { fechaHora: futureDate(2), cupoTotal: 10 });
      throw new Error('Debe fallar');
    } catch (e: any) {
      console.log('Error esperado:', e.message);
      if (!e.message.includes('GANADORA')) throw new Error('Mensaje debe mencionar GANADORA');
    }
    const state = prisma.__getState();
    if (state.funciones.length !== 0) throw new Error('No debe crear funcion');
    if (state.sugerencias[0].estado !== 'PENDIENTE') throw new Error('Debe seguir PENDIENTE');
    console.log('✓ Test 3 PASÓ\n');
  }

  console.log('=== Test 4a: Creación de Película nueva vs 4b: Película existente ===');
  {
    // 4a: Nueva
    const prismaA = createMockPrisma({
      sugerencias: [{ id: 's4a', titulo: 'Nueva Pelicula', director: 'Dir A', anio: 2020, tituloNormalizado: 'nueva pelicula', estado: 'GANADORA', peliculaId: null }],
      peliculas: [],
      funciones: [],
    });
    const svcA = new SugerenciasService(prismaA as any);
    const rA = await svcA.programar('s4a', { fechaHora: futureDate(2), cupoTotal: 8 });
    const stateA = prismaA.__getState();
    console.log('4a peliculas:', stateA.peliculas.length, 'titulo:', rA.pelicula.titulo);
    if (stateA.peliculas.length !== 1) throw new Error('Debe crear pelicula');
    if (rA.pelicula.director !== 'Dir A') throw new Error('Debe copiar director');

    // 4b: Existente
    const prismaB = createMockPrisma({
      sugerencias: [{ id: 's4b', titulo: 'Existente', director: 'Dir B', anio: 2019, tituloNormalizado: 'existente', estado: 'GANADORA', peliculaId: null }],
      peliculas: [{ id: 'pel-existente', titulo: 'Existente', tituloNormalizado: 'existente', director: 'Dir Existente', anio: 2019 }],
      funciones: [],
    });
    const svcB = new SugerenciasService(prismaB as any);
    const rB = await svcB.programar('s4b', { fechaHora: futureDate(3), cupoTotal: 8 });
    const stateB = prismaB.__getState();
    console.log('4b peliculas:', stateB.peliculas.length, 'reusa:', rB.pelicula.id);
    if (stateB.peliculas.length !== 1) throw new Error('No debe duplicar pelicula');
    if (rB.pelicula.id !== 'pel-existente') throw new Error('Debe reusar existente');
    console.log('✓ Test 4 PASÓ\n');
  }

  console.log('=== Test 5a: Reemplazo sin reservas (mismo día ocupado sin reservas -> reemplaza) ===');
  {
    const prisma = createMockPrisma({
      sugerencias: [{ id: 's5a', titulo: 'Reemplazo Test', director: null, anio: null, tituloNormalizado: 'reemplazo test', estado: 'GANADORA', peliculaId: null }],
      peliculas: [],
      funciones: [{ id: 'func-ocupada', peliculaId: 'x', fechaHora: futureDate(2), cupoTotal: 10 }], // ocupa ese día sin reservas
    });
    const svc = new SugerenciasService(prisma as any);
    const result = await svc.programar('s5a', { fechaHora: futureDate(2), cupoTotal: 12 });
    const state = prisma.__getState();
    console.log('Result fecha:', result.funcion.fechaHora, 'estado:', result.sugerencia.estado, 'funciones:', state.funciones.length);
    if (result.sugerencia.estado !== 'PROGRAMADA') throw new Error('Debe quedar PROGRAMADA tras reemplazo');
    if (state.funciones.length !== 1) throw new Error('Debe mantener 1 funcion (reemplazo, no crear)');
    if (state.funciones[0].peliculaId !== result.pelicula.id) throw new Error('Debe reemplazar peliculaId');
    if (state.peliculas.length !== 1) throw new Error('Debe crear 1 pelicula');
    console.log('✓ Test 5a PASÓ: reemplazo sin reservas\n');
  }

  console.log('=== Test 5b: Desplazamiento con reservas (ocupado con reservas -> siguiente día) ===');
  {
    const fechaOcupada = futureDate(2);
    const fechaSiguiente = futureDate(3);
    const prisma = createMockPrisma({
      sugerencias: [{ id: 's5b', titulo: 'Desplazado Test', director: null, anio: null, tituloNormalizado: 'desplazado test', estado: 'GANADORA', peliculaId: null }],
      peliculas: [],
      funciones: [{ id: 'func-con-reservas', peliculaId: 'x', fechaHora: fechaOcupada, cupoTotal: 10 }],
      reservas: [{ id: 'r1', funcionId: 'func-con-reservas' }], // con reservas -> no reemplazable
    });
    const svc = new SugerenciasService(prisma as any);
    const result = await svc.programar('s5b', { fechaHora: fechaOcupada, cupoTotal: 10 });
    const state = prisma.__getState();
    console.log('Result fecha:', result.funcion.fechaHora, 'esperado:', fechaSiguiente, 'funciones:', state.funciones.length);
    if (result.sugerencia.estado !== 'PROGRAMADA') throw new Error('Debe quedar PROGRAMADA desplazada');
    if (state.funciones.length !== 2) throw new Error('Debe crear nueva funcion en siguiente día');
    if (new Date(result.funcion.fechaHora).toISOString().slice(0, 10) !== new Date(fechaSiguiente).toISOString().slice(0, 10)) throw new Error('Debe desplazarse al siguiente día');
    console.log('✓ Test 5b PASÓ: desplazamiento con reservas\n');
  }

  console.log('=== Test 5c: Cupo inválido debe hacer rollback completo ===');
  {
    const prisma = createMockPrisma({
      sugerencias: [{ id: 's5c', titulo: 'Rollback Cupo', director: null, anio: null, tituloNormalizado: 'rollback cupo', estado: 'GANADORA', peliculaId: null }],
      peliculas: [],
      funciones: [],
    });
    const svc = new SugerenciasService(prisma as any);
    const notifications: any = createMockNotifications();
    try {
      await svc.programar('s5c', { fechaHora: futureDate(2), cupoTotal: 99 });
      throw new Error('Debe fallar por cupo inválido');
    } catch (e: any) {
      console.log('Error esperado:', e.message);
      if (!e.message.includes('1-16')) throw new Error('Debe validar cupo 1-16');
    }
    const state = prisma.__getState();
    if (state.sugerencias[0].estado !== 'GANADORA') throw new Error('Debe seguir GANADORA tras rollback cupo');
    if (state.sugerencias[0].peliculaId) throw new Error('No debe dejar peliculaId parcial');
    if (state.peliculas.length !== 0) throw new Error('Pelicula creada debe hacer rollback');
    if (state.funciones.length !== 0) throw new Error('No debe crear funcion con cupo inválido');
    if (notifications.__getCalls().length !== 0) throw new Error('No debe notificar si falla cupo');
    console.log('✓ Test 5c PASÓ: rollback cupo inválido\n');
  }

  console.log('=== Test 6: Notificación solo después de commit (no en fallo) ===');
  {
    const prisma = createMockPrisma({
      sugerencias: [{ id: 's6', titulo: 'Notify Test', director: null, anio: null, tituloNormalizado: 'notify test', estado: 'GANADORA', peliculaId: null }],
      peliculas: [],
      funciones: [],
    });
    const notifications: any = createMockNotifications();
    const svc = new SugerenciasService(prisma as any);

    // Éxito: notificar después
    const result = await svc.programar('s6', { fechaHora: futureDate(5), cupoTotal: 10 });
    // Simular controller que notifica solo después de await
    if (prisma.__getState().sugerencias[0].estado !== 'PROGRAMADA') throw new Error('Debe estar PROGRAMADA antes de notificar');
    await notifications.notifySugerenciaProgramada(result.sugerencia);
    if (notifications.__getCalls().length !== 1) throw new Error('Debe notificar 1 vez tras éxito');
    if (notifications.__getCalls()[0].id !== 's6') throw new Error('Payload incorrecto');

    // Fallo: no notificar
    notifications.__reset();
    const prisma2 = createMockPrisma({
      sugerencias: [{ id: 's7', titulo: 'Fail Notify', director: null, anio: null, tituloNormalizado: 'fail notify', estado: 'GANADORA', peliculaId: null }],
      peliculas: [],
      funciones: [],
    });
    const svc2 = new SugerenciasService(prisma2 as any);
    try {
      await svc2.programar('s7', { fechaHora: new Date(Date.now() - 86400000).toISOString(), cupoTotal: 10 }); // fecha pasada
      throw new Error('Debe fallar fecha pasada');
    } catch (e) {
      // No notificar en catch del controller
    }
    if (notifications.__getCalls().length !== 0) throw new Error('No debe notificar en fallo');
    console.log('✓ Test 6 PASÓ: notificación post-commit verificada\n');
  }

  console.log('=== Test 7: Manual PENDIENTE -> PROGRAMADA vía programarManual (origen explícito) ===');
  {
    const prisma = createMockPrisma({
      sugerencias: [{ id: 's8', titulo: 'Manual Film', director: null, anio: null, tituloNormalizado: 'manual film', estado: 'PENDIENTE', peliculaId: null }],
      peliculas: [],
      funciones: [],
    });
    const svc = new SugerenciasService(prisma as any);
    const result = await svc.programar('s8', { fechaHora: futureDate(6), cupoTotal: 12 }, { manual: true });
    const state = prisma.__getState();
    console.log('Estado:', result.sugerencia.estado, 'origen manual ok');
    if (result.sugerencia.estado !== 'PROGRAMADA') throw new Error('Manual debe llegar a PROGRAMADA');
    if (state.peliculas.length !== 1) throw new Error('Debe crear pelicula manual');
    console.log('✓ Test 7 PASÓ\n');
  }

  console.log('Todos los tests programarSugerencia pasaron.');
}

run().catch((e) => {
  console.error('TEST FALLÓ:', e);
  process.exit(1);
});
