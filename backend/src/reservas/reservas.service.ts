import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { normalizeContacto } from '../common/utils/normalize';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReservasService {
  constructor(private prisma: PrismaService) {}

  async reservar(funcionId: string, dto: CreateReservaDto) {
    const contactoNormalizado = normalizeContacto(dto.contacto);
    const cantidad = dto.cantidad;

    return this.prisma.$transaction(async (tx) => {
      // Lock pesimista de la fila Funcion — Read Committed es suficiente.
      // Cualquier otra transacción que intente reservar la misma función
      // se bloquea aquí hasta que esta termine, evitando overbooking.
      const rows = await tx.$queryRaw<Array<{ id: string; cupoTotal: number }>>`
        SELECT id, "cupoTotal" FROM "Funcion" WHERE id = ${funcionId} FOR UPDATE
      `;
      if (rows.length === 0) {
        throw new NotFoundException('Función no encontrada');
      }
      const cupoTotal = rows[0].cupoTotal;

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
  }
}
