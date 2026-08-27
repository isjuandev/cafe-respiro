import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVotacionDto } from './dto/create-votacion.dto';
import { fijarHora, HORA_CIERRE_VOTACION } from '../common/utils/horarios';

@Injectable()
export class VotacionesService {
  private readonly logger = new Logger(VotacionesService.name);
  private readonly expirationTimer: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {
    // Timer es solo polling best-effort; la exclusión mutua es DB (updateMany condicional + FOR UPDATE).
    this.expirationTimer = setInterval(() => this.closeExpired().catch((error) => this.logger.warn(`No se pudo cerrar una votación: ${error}`)), 60_000);
    this.expirationTimer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.expirationTimer);
  }

  async getActive() {
    await this.closeExpired();
    const votacion = await this.prisma.votacion.findFirst({
      where: { estado: 'ACTIVA', cierraAt: { gt: new Date() } },
      include: { sugerencias: { include: { _count: { select: { votos: true } } } } },
    });
    if (!votacion) return { activa: false, sugerencias: [] };
    const sugerencias = [...votacion.sugerencias].sort((a, b) => b._count.votos - a._count.votos || b.createdAt.getTime() - a.createdAt.getTime());
    return { activa: true, id: votacion.id, iniciaAt: votacion.iniciaAt, cierraAt: votacion.cierraAt, sugerencias };
  }

  async listAdmin() {
    await this.closeExpired();
    return this.prisma.votacion.findMany({
      orderBy: { createdAt: 'desc' },
      include: { ganadora: true, sugerencias: { include: { _count: { select: { votos: true } } } } },
    });
  }

  async create(dto: CreateVotacionDto) {
    const cierraAt = new Date(dto.cierraAt);
    if (Number.isNaN(cierraAt.getTime()) || cierraAt <= new Date()) throw new BadRequestException('cierraAt debe ser una fecha futura');
    const cierreFijo = fijarHora(cierraAt, HORA_CIERRE_VOTACION);
    if (cierreFijo <= new Date()) throw new BadRequestException('La fecha de cierre debe ser futura');
    const ids = [...new Set(dto.sugerenciaIds)];
    const sugerencias = await this.prisma.sugerencia.findMany({ where: { id: { in: ids } } });
    if (sugerencias.length !== ids.length) throw new BadRequestException('Una o más sugerencias no existen');
    if (sugerencias.some((s) => s.estado !== 'PENDIENTE' || s.votacionId)) throw new ConflictException('Solo se pueden incluir sugerencias pendientes sin ronda');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const votacion = await tx.votacion.create({ data: { iniciaAt: new Date(), cierraAt: cierreFijo } });
        await tx.sugerencia.updateMany({ where: { id: { in: ids } }, data: { votacionId: votacion.id } });
        return tx.votacion.findUnique({ where: { id: votacion.id }, include: { sugerencias: true } });
      });
    } catch (error: any) {
      if (error.code === 'P2002') throw new ConflictException('Ya existe una votación activa');
      throw error;
    }
  }

  async closeActive() {
    const active = await this.prisma.votacion.findFirst({ where: { estado: 'ACTIVA' }, select: { id: true } });
    if (!active) return { cerrada: false, mensaje: 'No hay votación activa' };
    return this.tryClose(active.id);
  }

  async closeExpired() {
    // Puede haber 0..1 expiradas por el índice parcial único, pero soportamos múltiples para robustez.
    const expired = await this.prisma.votacion.findMany({
      where: { estado: 'ACTIVA', cierraAt: { lte: new Date() } },
      select: { id: true },
    });
    if (!expired.length) return null;
    let last: any = null;
    for (const v of expired) {
      last = await this.tryClose(v.id);
    }
    return last;
  }

  /**
   * Cierre atómico, idempotente y seguro ante concurrencia.
   * - Solo una ejecución gana el CAS `updateMany WHERE estado='ACTIVA'`.
   * - La elección de ganadora ocurre DENTRO de la transacción con conteos frescos.
   * - `FOR UPDATE` evita que dos transacciones lean votos inconsistentes.
   * - Reintentos múltiples no duplican NotificationLog ni cambian ganadora.
   */
  private async tryClose(id: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1) Lock pesimista de la votación ACTIVA. Si ya está CERRADA, FOR UPDATE devuelve 0 filas.
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Votacion" WHERE id = ${id} AND estado = 'ACTIVA' FOR UPDATE
      `;
      if (locked.length === 0) {
        return { cerrada: false, mensaje: 'La votación ya estaba cerrada' };
      }

      // 2) Recalcular votos DENTRO de la transacción (fresco, consistente con el lock).
      //    Solo sugerencias de esta votación, votos reales al momento del cierre.
      const sugerencias = await tx.sugerencia.findMany({
        where: { votacionId: id },
        include: { _count: { select: { votos: true } } },
      });

      // Invariante: ganadora debe pertenecer a la votación; desempate por id (estable).
      const winner = sugerencias.length
        ? [...sugerencias].sort((a, b) => b._count.votos - a._count.votos || a.id.localeCompare(b.id))[0]
        : null;

      // 3) CAS atómico: solo el primer worker logra CERRADA. Segundo ve closed.count===0.
      const closed = await tx.votacion.updateMany({
        where: { id, estado: 'ACTIVA' },
        data: { estado: 'CERRADA', ganadoraId: winner?.id ?? null },
      });
      if (!closed.count) {
        return { cerrada: false, mensaje: 'La votación ya estaba cerrada' };
      }

      // 4) Promover ganadora PENDIENTE -> GANADORA solo si aún es PENDIENTE (idempotente).
      if (winner) {
        await tx.sugerencia.updateMany({
          where: { id: winner.id, estado: 'PENDIENTE' },
          data: { estado: 'GANADORA' },
        });
      }

      // 5) NotificationLog solo se crea si el CAS anterior ganó. Reintento no duplica.
      await tx.notificationLog.create({
        data: {
          tipo: 'VOTACION_CERRADA',
          payload: { votacionId: id, ganadoraId: winner?.id ?? null, votosGanadora: winner?._count.votos ?? 0, at: new Date().toISOString() },
        },
      });

      this.logger.log(`Votación cerrada: ${id}; ganadora ${winner?.id ?? 'sin sugerencias'} (${winner?._count.votos ?? 0} votos) -> GANADORA`);
      return { cerrada: true, votacionId: id, ganadoraId: winner?.id ?? null, votosGanadora: winner?._count.votos ?? 0 };
    });
  }

  // Mantener compatibilidad con código que llamaba close(id, suggestions) — ahora delega a tryClose.
  // Se conserva firma vieja pero ignora suggestions stale y recalcula dentro de tryClose.
  private async close(id: string, _suggestions: Array<{ id: string; _count: { votos: number } }>) {
    return this.tryClose(id);
  }
}
