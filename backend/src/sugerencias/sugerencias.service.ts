import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSugerenciaDto } from './dto/create-sugerencia.dto';
import { normalizeTitulo, normalizeContacto } from '../common/utils/normalize';
import { Prisma } from '@prisma/client';

@Injectable()
export class SugerenciasService {
  constructor(private prisma: PrismaService) {}

  async findActivas() {
    return this.prisma.sugerencia.findMany({
      where: { estado: 'PENDIENTE' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { votos: true } },
      },
    });
  }

  async create(dto: CreateSugerenciaDto) {
    const tituloNormalizado = normalizeTitulo(dto.titulo);
    const contactoNormalizado = normalizeContacto(dto.contacto);

    // Intento directo — la garantía anti-carrera está en el índice parcial único de PG
    try {
      const creada = await this.prisma.sugerencia.create({
        data: {
          titulo: dto.titulo.trim(),
          tituloNormalizado,
          comentario: dto.comentario?.trim() || null,
          nombreSolicitante: dto.nombre.trim(),
          contacto: contactoNormalizado,
          estado: 'PENDIENTE',
        },
      });
      return { duplicada: false, sugerencia: creada };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Violación del índice parcial único → ya existe una activa con mismo tituloNormalizado
        const existente = await this.prisma.sugerencia.findFirst({
          where: {
            tituloNormalizado,
            estado: { in: ['PENDIENTE', 'PROGRAMADA'] },
          },
          include: { _count: { select: { votos: true } } },
        });
        if (existente) {
          return { duplicada: true, sugerencia: existente };
        }
      }
      throw error;
    }
  }
}
