import { Controller, Get, Patch, Param, Body, UseGuards, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from '../common/guards/admin.guard';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { NotificationsService } from '../notifications/notifications.service';

@UseGuards(AdminGuard)
@Controller('admin/sugerencias')
export class AdminSugerenciasController {
  private logger = new Logger(AdminSugerenciasController.name);
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  @Get()
  async list() {
    const sugerencias = await this.prisma.sugerencia.findMany({
      include: { _count: { select: { votos: true } } },
    });
    const sorted = sugerencias.sort((a, b) => {
      if (b._count.votos !== a._count.votos) return b._count.votos - a._count.votos;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    return { sugerencias: sorted };
  }

  @Patch(':id/estado')
  async updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoDto) {
    const existente = await this.prisma.sugerencia.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException('Sugerencia no encontrada');

    const actualizada = await this.prisma.sugerencia.update({
      where: { id },
      data: { estado: dto.estado },
    });

    // Notify post-commit, con cliente global, no bloquea respuesta
    if (dto.estado === 'PROGRAMADA') {
      this.notifications.notifySugerenciaProgramada(actualizada).catch((e) => this.logger.warn(`notifySugerenciaProgramada falló: ${e}`));
    }

    return { sugerencia: actualizada };
  }
}
