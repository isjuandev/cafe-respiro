import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { normalizeContacto } from '../common/utils/normalize';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReservasService {
  private logger = new Logger(ReservasService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService
  ) {}

  async reservar(
    funcionId: string,
    dto: CreateReservaDto,
    authUser: { contacto: string; nombre?: string }
  ) {
    const contactoNormalizado = normalizeContacto(authUser.contacto);
    const cantidad = dto.cantidad;
    const nombre = dto.nombre?.trim() || authUser.nombre?.trim() || 'Cliente';

    const result = await this.prisma.$transaction(async (tx) => {
      // Lock pesimista de la fila Funcion — Read Committed es suficiente.
      // Cualquier otra transacción que intente reservar la misma función
      // se bloquea aquí hasta que esta termine, evitando overbooking.
      const rows = await tx.$queryRaw<Array<{ id: string; cupoTotal: number; fechaHora: Date }>>`
        SELECT id, "cupoTotal", "fechaHora" FROM "Funcion" WHERE id = ${funcionId} FOR UPDATE
      `;
      if (rows.length === 0) {
        throw new NotFoundException('Función no encontrada');
      }
      const cupoTotal = rows[0].cupoTotal;
      if (new Date(rows[0].fechaHora) <= new Date()) {
        throw new ConflictException('No se puede reservar una función pasada');
      }

      // Suma de cupos ya ocupados dentro de la misma transacción
      const agg = await tx.reserva.aggregate({
        _sum: { cantidad: true },
        where: { funcionId },
      });
      const ocupados = agg._sum.cantidad ?? 0;
      const disponibles = cupoTotal - ocupados;

      if (disponibles < cantidad) {
        throw new ConflictException(`Cupo lleno: solo ${disponibles} lugares disponibles`);
      }
      if (disponibles === 0) {
        throw new ConflictException('Cupo lleno');
      }

      try {
        const reserva = await tx.reserva.create({
          data: {
            funcionId,
            nombre,
            contacto: contactoNormalizado,
            cantidad,
          },
        });
        return {
          reserva,
          cuposDisponibles: disponibles - cantidad,
          cuposOcupados: ocupados + cantidad,
        };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException('Ya tienes una reserva activa para esta función');
        }
        throw error;
      }
    });

    // Notificación post-commit segura
    const funcion = await this.prisma.funcion.findUnique({
      where: { id: funcionId },
      include: { pelicula: true },
    });
    this.notifications
      .notifyReservaConfirmada(result.reserva, funcion)
      .catch((e) => this.logger.warn(`notifyReservaConfirmada falló: ${e}`));

    return result;
  }

  async cancelar(reservaId: string, authUser: { contacto: string; role?: string }) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { funcion: { include: { pelicula: true } } },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (
      authUser.role !== 'admin' &&
      normalizeContacto(reserva.contacto) !== normalizeContacto(authUser.contacto)
    ) {
      throw new ForbiddenException('No tienes permiso para cancelar esta reserva');
    }

    if (new Date(reserva.funcion.fechaHora) <= new Date()) {
      throw new ConflictException('No se puede cancelar la reserva de una función pasada');
    }

    await this.prisma.reserva.delete({
      where: { id: reservaId },
    });

    try {
      await this.prisma.notificationLog.create({
        data: {
          tipo: 'RESERVA_CANCELADA',
          destinatario: reserva.contacto,
          payload: {
            reservaId: reserva.id,
            funcionId: reserva.funcionId,
            pelicula: reserva.funcion.pelicula?.titulo,
            cantidad: reserva.cantidad,
          } as any,
        },
      });
    } catch (e) {
      this.logger.warn(`NotificationLog cancelada falló: ${e}`);
    }

    return {
      ok: true,
      message: 'Reserva cancelada exitosamente',
      funcionId: reserva.funcionId,
      cuposLiberados: reserva.cantidad,
    };
  }
}
