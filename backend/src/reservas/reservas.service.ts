import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
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
    private notifications: NotificationsService,
  ) {}

  async reservar(funcionId: string, dto: CreateReservaDto) {
    const contactoNormalizado = normalizeContacto(dto.contacto);
    const cantidad = dto.cantidad;

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
            nombre: dto.nombre.trim(),
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
          throw new ConflictException('Ya tienes una reserva para esta función con ese contacto');
        }
        throw error;
      }
    });

    // Notify post-commit con cliente global (nunca con tx), no bloquea respuesta
    const funcion = await this.prisma.funcion.findUnique({
      where: { id: funcionId },
      include: { pelicula: true },
    });
    this.notifications
      .notifyReservaConfirmada(result.reserva, funcion)
      .catch((e) => this.logger.warn(`notifyReservaConfirmada falló: ${e}`));

    return result;
  }
}
