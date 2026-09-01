import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';

@Controller()
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  /**
   * Endpoint de checkout / creación de reserva (Paso 3).
   * Admite compras tanto de clientes autenticados como de invitados.
   */
  @UseGuards(OptionalAuthGuard)
  @Post('funciones/:id/reservas')
  async reservar(
    @Param('id') id: string,
    @Body() dto: CreateReservaDto,
    @Req() req: Request
  ) {
    const authUser = (req as any).user;
    return this.reservasService.reservar(id, dto, authUser);
  }

  /**
   * Consulta pública de estado de reserva mediante su código amigable (ej: CIN-TN56W).
   * Usado por la pantalla de confirmación y /mi-reserva/[codigo].
   */
  @Get('reservas/:codigo')
  async getByCodigo(@Param('codigo') codigo: string) {
    return this.reservasService.findByCodigo(codigo);
  }

  /**
   * Acción administrativa para validar y marcar como pagada una reserva.
   */
  @UseGuards(AuthGuard)
  @RequireRole('admin')
  @Patch('admin/reservas/:id/confirmar-pago')
  async confirmarPago(@Param('id') id: string, @Req() req: Request) {
    const admin = (req as any).admin || (req as any).user;
    return this.reservasService.confirmarPago(id, admin?.sub || 'admin');
  }

  /**
   * Cancelación de reserva por el usuario autenticado o por el administrador.
   */
  @UseGuards(AuthGuard)
  @Delete('mis-reservas/:id')
  async cancelar(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.reservasService.cancelar(id, user);
  }
}
