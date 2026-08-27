import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaMenuDto, UpdateCategoriaMenuDto } from './dto/categoria-menu.dto';
import { CreateItemMenuDto, UpdateItemMenuDto } from './dto/item-menu.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async findPublic() {
    return this.prisma.categoriaMenu.findMany({
      where: { items: { some: { disponible: true } } },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        orden: true,
        items: {
          where: { disponible: true },
          orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
          select: { id: true, nombre: true, descripcion: true, precio: true, orden: true },
        },
      },
    });
  }

  async findAdmin() {
    return this.prisma.categoriaMenu.findMany({
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      include: { items: { orderBy: [{ orden: 'asc' }, { nombre: 'asc' }] } },
    });
  }

  createCategoria(dto: CreateCategoriaMenuDto) {
    return this.prisma.categoriaMenu.create({ data: { nombre: dto.nombre.trim(), orden: dto.orden ?? 0 } });
  }

  async updateCategoria(id: string, dto: UpdateCategoriaMenuDto) {
    await this.requireCategoria(id);
    return this.prisma.categoriaMenu.update({ where: { id }, data: { ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }), ...(dto.orden !== undefined && { orden: dto.orden }) } });
  }

  async deleteCategoria(id: string) {
    await this.requireCategoria(id);
    const items = await this.prisma.itemMenu.count({ where: { categoriaId: id } });
    if (items > 0) throw new ConflictException('No se puede eliminar una categoría con ítems');
    await this.prisma.categoriaMenu.delete({ where: { id } });
    return { ok: true };
  }

  async createItem(dto: CreateItemMenuDto) {
    await this.requireCategoria(dto.categoriaId);
    return this.prisma.itemMenu.create({ data: { categoriaId: dto.categoriaId, nombre: dto.nombre.trim(), descripcion: dto.descripcion?.trim() || null, precio: dto.precio, disponible: dto.disponible ?? true, orden: dto.orden ?? 0 } });
  }

  async updateItem(id: string, dto: UpdateItemMenuDto) {
    await this.requireItem(id);
    if (dto.categoriaId) await this.requireCategoria(dto.categoriaId);
    return this.prisma.itemMenu.update({ where: { id }, data: { ...(dto.categoriaId !== undefined && { categoriaId: dto.categoriaId }), ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }), ...(dto.descripcion !== undefined && { descripcion: dto.descripcion?.trim() || null }), ...(dto.precio !== undefined && { precio: dto.precio }), ...(dto.disponible !== undefined && { disponible: dto.disponible }), ...(dto.orden !== undefined && { orden: dto.orden }) } });
  }

  async toggleItem(id: string) {
    const item = await this.requireItem(id);
    return this.prisma.itemMenu.update({ where: { id }, data: { disponible: !item.disponible } });
  }

  async deleteItem(id: string) {
    await this.requireItem(id);
    await this.prisma.itemMenu.delete({ where: { id } });
    return { ok: true };
  }

  private async requireCategoria(id: string) {
    const category = await this.prisma.categoriaMenu.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  private async requireItem(id: string) {
    const item = await this.prisma.itemMenu.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Ítem no encontrado');
    return item;
  }
}
