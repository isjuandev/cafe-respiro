import { Controller, Get } from '@nestjs/common';
import { VotacionesService } from './votaciones.service';

@Controller('votaciones')
export class VotacionesController {
  constructor(private readonly votaciones: VotacionesService) {}

  @Get('activa')
  getActive() {
    return this.votaciones.getActive();
  }
}
