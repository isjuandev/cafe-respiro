import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TiposEntradaService {
  constructor(private prisma: PrismaService) {}

  async findActivos() {
    let tipos = await this.prisma.tipoEntrada.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    });

    // Sembrado automático de contingencia si la tabla está vacía
    if (tipos.length === 0) {
      await this.prisma.tipoEntrada.createMany({
        data: [
          {
            id: 'tipo_esencial',
            nombre: 'Esencial',
            precio: 15000,
            descripcion: 'Entrada general a la función con proyección en sala íntima.',
            orden: 1,
            activo: true,
          },
          {
            id: 'tipo_preferencial',
            nombre: 'Preferencial',
            precio: 30000,
            descripcion: 'Entrada + palomitas de maíz individuales + bebida artesanal a elección.',
            orden: 2,
            activo: true,
          },
          {
            id: 'tipo_especial',
            nombre: 'Especial',
            precio: 45000,
            descripcion: 'Entrada + combo especial de la casa + postre artesanal + café de especialidad.',
            orden: 3,
            activo: true,
          },
        ],
        skipDuplicates: true,
      });

      tipos = await this.prisma.tipoEntrada.findMany({
        where: { activo: true },
        orderBy: { orden: 'asc' },
      });
    }

    return tipos.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      precio: t.precio,
      descripcion: t.descripcion,
      orden: t.orden,
    }));
  }

  async findAllAdmin() {
    return this.prisma.tipoEntrada.findMany({
      orderBy: { orden: 'asc' },
    });
  }
}
