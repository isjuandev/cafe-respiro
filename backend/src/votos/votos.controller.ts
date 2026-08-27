import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { VotosService } from './votos.service';
import { CreateVotoDto } from './dto/create-voto.dto';
import { VotosRateLimitGuard } from '../common/rate-limit/votos-rate-limit.guard';

@Controller('sugerencias/:id/votos')
@UseGuards(VotosRateLimitGuard)
export class VotosController {
  constructor(private readonly votosService: VotosService) {}

  @Post()
  async votar(@Param('id') id: string, @Body() dto: CreateVotoDto) {
    return this.votosService.votar(id, dto);
  }
}
