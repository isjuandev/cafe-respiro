import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVotoDto } from './dto/create-voto.dto';
import { normalizeContacto } from '../common/utils/normalize';
import { Prisma } from '@prisma/client';
import { VotacionesService } from '../votaciones/votaciones.service';

@Injectable()
export class VotosService {
  constructor(private prisma: PrismaService, private votaciones: VotacionesService) {}

  async votar(sugerenciaId: string, dto: CreateVotoDto) {
    await this.votaciones.closeExpired();
    const contactoNormalizado = normalizeContacto(dto.contacto);

    // Verifica que la sugerencia exista y esté activa (PENDIENTE)
    const sugerencia = await this.prisma.sugerencia.findUnique({
      where: { id: sugerenciaId },
      include: { votacion: true },
    });
    if (!sugerencia) {
      throw new NotFoundException('Sugerencia no encontrada');
    }
    if (sugerencia.estado !== 'PENDIENTE' || !sugerencia.votacion || sugerencia.votacion.estado !== 'ACTIVA' || sugerencia.votacion.cierraAt <= new Date()) {
      throw new ConflictException('Solo se puede votar por sugerencias pendientes');
    }

    try {
      const voto = await this.prisma.voto.create({
        data: {
          sugerenciaId,
          nombreVotante: dto.nombre.trim(),
          contacto: contactoNormalizado,
        },
      });
      // Retorna voto + conteo actualizado para ranking
      const count = await this.prisma.voto.count({ where: { sugerenciaId } });
      return { voto, votos: count };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya votaste esta sugerencia');
      }
      throw error;
    }
  }
}
