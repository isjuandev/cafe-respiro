import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePeliculaDto } from './dto/create-pelicula.dto';
import { normalizeTitulo } from '../common/utils/normalize';

@Injectable()
export class PeliculasService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.pelicula.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findAllAdmin() {
    return this.prisma.pelicula.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { funciones: true } } },
    });
  }

  async create(dto: CreatePeliculaDto) {
    const tituloNormalizado = normalizeTitulo(dto.titulo);

    // Reutiliza normalización Sprint 1 para aviso de duplicado (sin unique duro por remakes)
    const existente = await this.prisma.pelicula.findFirst({
      where: { tituloNormalizado },
    });
    if (existente) {
      return { duplicada: true, pelicula: existente, aviso: 'Ya existe una película con título muy similar en la biblioteca' };
    }

    const pelicula = await this.prisma.pelicula.create({
      data: {
        titulo: dto.titulo.trim(),
        tituloNormalizado,
        director: dto.director?.trim() || null,
        genero: dto.genero?.trim() || null,
        anio: dto.anio ?? null,
        duracionMin: dto.duracionMin ?? null,
        sinopsis: dto.sinopsis?.trim() || null,
        posterUrl: dto.posterUrl?.trim() || null,
      },
    });
    return { duplicada: false, pelicula };
  }

  // Helper para upsert desde sugerencia (reusa misma normalización)
  async findOrCreateFromSugerencia(sugerencia: {
    titulo: string;
    director?: string | null;
    genero?: string | null;
    anio?: number | null;
    duracionMin?: number | null;
    sinopsis?: string | null;
    posterUrl?: string | null;
  }) {
    const tituloNormalizado = normalizeTitulo(sugerencia.titulo);
    let pelicula = await this.prisma.pelicula.findFirst({ where: { tituloNormalizado } });
    if (pelicula) return pelicula;
    pelicula = await this.prisma.pelicula.create({
      data: {
        titulo: sugerencia.titulo.trim(),
        tituloNormalizado,
        director: sugerencia.director?.trim() || null,
        genero: sugerencia.genero?.trim() || null,
        anio: sugerencia.anio ?? null,
        duracionMin: sugerencia.duracionMin ?? null,
        sinopsis: sugerencia.sinopsis?.trim() || null,
        posterUrl: sugerencia.posterUrl?.trim() || null,
      },
    });
    return pelicula;
  }
}
