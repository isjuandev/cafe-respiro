import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { CreateVotacionDto } from '../votaciones/dto/create-votacion.dto';
import { VotacionesService } from '../votaciones/votaciones.service';

@UseGuards(AuthGuard)
@RequireRole('admin')
@Controller('admin/votaciones')
export class AdminVotacionesController {
  constructor(private readonly votaciones: VotacionesService) {}

  @Get()
  list() {
    return this.votaciones.listAdmin();
  }

  @Post()
  create(@Body() dto: CreateVotacionDto) {
    return this.votaciones.create(dto);
  }

  @Post('cerrar')
  cerrar() {
    return this.votaciones.closeActive();
  }
}
