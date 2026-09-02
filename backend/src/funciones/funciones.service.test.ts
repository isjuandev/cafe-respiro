/**
 * Tests para FuncionesService.eliminar(id)
 * Ejecutar: npx ts-node src/funciones/funciones.service.test.ts
 */

import { FuncionesService } from './funciones.service';
import { NotFoundException } from '@nestjs/common';

function createMockPrisma(initial: {
  sugerencias: any[];
  peliculas: any[];
  funciones: any[];
}) {
  let sugerencias = initial.sugerencias.map((s) => ({ ...s }));
  let peliculas = initial.peliculas.map((p) => ({ ...p }));
  let funciones = initial.funciones.map((f) => ({ ...f }));

  const prisma: any = {
    funcion: {
      findUnique: async ({ where, include }: any) => {
        const f = funciones.find((x) => x.id === where.id);
        if (!f) return null;
        const res: any = { ...f };
        if (include?.pelicula) {
          res.pelicula = peliculas.find((p) => p.id === f.peliculaId) || null;
        }
        return res;
      },
    },
    $transaction: async (fn: (tx: any) => Promise<any>) => {
      let localSugs = sugerencias.map((s) => ({ ...s }));
      let localFuncs = funciones.map((f) => ({ ...f }));

      const tx: any = {
        funcion: {
          count: async ({ where }: any) => {
            return localFuncs.filter((f) => {
              if (where.peliculaId && f.peliculaId !== where.peliculaId) return false;
              if (where.id?.not && f.id === where.id.not) return false;
              return true;
            }).length;
          },
          delete: async ({ where }: any) => {
            const idx = localFuncs.findIndex((f) => f.id === where.id);
            if (idx === -1) throw new Error('Funcion not found to delete');
            const deleted = localFuncs.splice(idx, 1)[0];
            return deleted;
          },
        },
        sugerencia: {
          updateMany: async ({ where, data }: any) => {
            let count = 0;
            for (const s of localSugs) {
              if (where.peliculaId && s.peliculaId !== where.peliculaId) continue;
              if (where.estado && s.estado !== where.estado) continue;
              Object.assign(s, data);
              count++;
            }
            return { count };
          },
        },
      };

      const result = await fn(tx);
      sugerencias = localSugs;
      funciones = localFuncs;
      return result;
    },
    __getState: () => ({
      sugerencias: sugerencias.map((s) => ({ ...s })),
      peliculas: peliculas.map((p) => ({ ...p })),
      funciones: funciones.map((f) => ({ ...f })),
    }),
  };

  return prisma;
}

async function run() {
  console.log('=== Test 1: Eliminar función existente y revertir Sugerencia a GANADORA ===');
  {
    const prisma = createMockPrisma({
      peliculas: [{ id: 'pel-1', titulo: 'Cinema Paradiso' }],
      funciones: [{ id: 'func-1', peliculaId: 'pel-1', fechaHora: new Date('2026-09-10T19:00:00Z'), cupoTotal: 16 }],
      sugerencias: [{ id: 'sug-1', titulo: 'Cinema Paradiso', peliculaId: 'pel-1', estado: 'PROGRAMADA' }],
    });

    const svc = new FuncionesService(prisma as any);
    const result = await svc.eliminar('func-1');

    if (!result.success) throw new Error('Debe retornar success: true');
    const state = prisma.__getState();
    if (state.funciones.length !== 0) throw new Error('La función debe ser eliminada');
    if (state.sugerencias[0].estado !== 'GANADORA') {
      throw new Error(`Sugerencia debe revertir a GANADORA, actual: ${state.sugerencias[0].estado}`);
    }
    console.log('✓ Test 1 PASÓ: Función eliminada y sugerencia revertida a GANADORA\n');
  }

  console.log('=== Test 2: Eliminar función pero existen otras funciones para la misma película ===');
  {
    const prisma = createMockPrisma({
      peliculas: [{ id: 'pel-1', titulo: 'Cinema Paradiso' }],
      funciones: [
        { id: 'func-1', peliculaId: 'pel-1', fechaHora: new Date('2026-09-10T19:00:00Z'), cupoTotal: 16 },
        { id: 'func-2', peliculaId: 'pel-1', fechaHora: new Date('2026-09-11T19:00:00Z'), cupoTotal: 16 },
      ],
      sugerencias: [{ id: 'sug-1', titulo: 'Cinema Paradiso', peliculaId: 'pel-1', estado: 'PROGRAMADA' }],
    });

    const svc = new FuncionesService(prisma as any);
    const result = await svc.eliminar('func-1');

    if (!result.success) throw new Error('Debe retornar success: true');
    const state = prisma.__getState();
    if (state.funciones.length !== 1) throw new Error('Debe quedar 1 función');
    if (state.sugerencias[0].estado !== 'PROGRAMADA') {
      throw new Error(`Sugerencia debe permanecer PROGRAMADA porque aún tiene func-2`);
    }
    console.log('✓ Test 2 PASÓ: Sugerencia se mantiene PROGRAMADA al haber otra función\n');
  }

  console.log('=== Test 3: Eliminar función no existente debe lanzar NotFoundException ===');
  {
    const prisma = createMockPrisma({
      peliculas: [],
      funciones: [],
      sugerencias: [],
    });

    const svc = new FuncionesService(prisma as any);
    try {
      await svc.eliminar('func-no-existe');
      throw new Error('Debe fallar con NotFoundException');
    } catch (e: any) {
      if (!(e instanceof NotFoundException) && !e.message?.includes('Función no encontrada')) {
        throw new Error(`Error inesperado: ${e.message}`);
      }
    }
    console.log('✓ Test 3 PASÓ: NotFoundException lanzado correctamente\n');
  }

  console.log('Todos los tests de FuncionesService.eliminar pasaron correctamente.');
}

run().catch((e) => {
  console.error('TEST FALLÓ:', e);
  process.exit(1);
});
