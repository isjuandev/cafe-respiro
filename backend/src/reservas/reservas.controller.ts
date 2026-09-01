import { Controller, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller()
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @UseGuards(AuthGuard)
  @Post('funciones/:id/reservas')
  async reservar(
    @Param('id') id: string,
    @Body() dto: CreateReservaDto,
    @Req() req: Request
  ) {
    const user = (req as any).user;
    return this.reservasService.reservar(id, dto, {
      contacto: user.contacto || user.sub,
      nombre: dto.nombre,
    });
  }

  @UseGuards(AuthGuard)
  @Delete('mis-reservas/:id')
  async cancelar(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.reservasService.cancelar(id, user);
  }
}
