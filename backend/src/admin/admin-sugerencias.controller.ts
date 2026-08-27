import { Controller, Get, Patch, Param, Body, UseGuards, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { NotificationsService } from '../notifications/notifications.service';

@UseGuards(AuthGuard)
@RequireRole('admin')
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
      if ((b as any)._count.votos !== (a as any)._count.votos) return (b as any)._count.votos - (a as any)._count.votos;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    return { sugerencias: sorted };
  }

  @Patch(':id/estado')
  async updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoDto) {
    const existente = await this.prisma.sugerencia.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException('Sugerencia no encontrada');

    // Máquina de estados estricta (reglas 1-7):
    // - PENDIENTE -> GANADORA solo vía cierre de votación (no por PATCH)
    // - PENDIENTE -> DESCARTADA permitido
    // - GANADORA -> DESCARTADA permitido, GANADORA -> PROGRAMADA solo vía funcion (no PATCH)
    // - PROGRAMADA y DESCARTADA son terminales; no se permite PATCH a PROGRAMADA/GANADORA
    // - No permitir PENDIENTE -> PROGRAMADA directo
    const from = existente.estado as string;
    const to = dto.estado as string;

    if (from === to) return { sugerencia: existente };

    // Bloquear cualquier intento de llegar a PROGRAMADA o GANADORA por endpoint genérico
    if (to === 'GANADORA' || to === 'PROGRAMADA') {
      throw new ConflictException(
        `Transición ${from} -> ${to} no permitida por PATCH. GANADORA solo vía cierre de votación; PROGRAMADA solo vía creación de Pelicula+Funcion (GANADORA->PROGRAMADA) o POST programar-manual explícito.`,
      );
    }

    // Transiciones permitidas por PATCH: PENDIENTE->DESCARTADA, GANADORA->DESCARTADA, DESCARTADA->PENDIENTE (reabrir) opcional
    const permitidas: Record<string, string[]> = {
      PENDIENTE: ['DESCARTADA'],
      GANADORA: ['DESCARTADA', 'PENDIENTE'], // GANADORA->PENDIENTE solo si admin corrige error, con validación de no tener pelicula/funcion futura
      PROGRAMADA: [], // terminal, no se toca por PATCH
      DESCARTADA: ['PENDIENTE'], // reabrir descartada
    };

    if (!permitidas[from]?.includes(to)) {
      throw new ConflictException(`Transición ${from} -> ${to} no permitida. Permitidas: ${permitidas[from]?.join(', ') || 'ninguna'}`);
    }

    // Validación extra: GANADORA->PENDIENTE solo si no tiene programacion (evita romper PROGRAMADA)
    if (from === 'GANADORA' && to === 'PENDIENTE' && existente.peliculaId) {
      const tieneFuncion = await this.prisma.funcion.findFirst({
        where: { peliculaId: existente.peliculaId, fechaHora: { gt: new Date() } },
      });
      if (tieneFuncion) throw new ConflictException('No se puede revertir GANADORA con función futura programada');
    }

    if (to === 'DESCARTADA' && from === 'PROGRAMADA') {
      throw new ConflictException('PROGRAMADA es terminal; no puede descartarse sin cancelar función');
    }

    const actualizada = await this.prisma.sugerencia.update({
      where: { id },
      data: { estado: dto.estado as any },
    });

    return { sugerencia: actualizada };
  }
}
