import { Controller, Post, Param, Body } from '@nestjs/common';
import { VotosService } from './votos.service';
import { CreateVotoDto } from './dto/create-voto.dto';

@Controller('sugerencias/:id/votos')
export class VotosController {
  constructor(private readonly votosService: VotosService) {}

  @Post()
  async votar(@Param('id') id: string, @Body() dto: CreateVotoDto) {
    return this.votosService.votar(id, dto);
  }
}
