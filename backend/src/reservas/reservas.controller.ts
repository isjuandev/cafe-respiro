import { Controller, Post, Param, Body } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';

@Controller('funciones/:id/reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  async reservar(@Param('id') id: string, @Body() dto: CreateReservaDto) {
    return this.reservasService.reservar(id, dto);
  }
}
