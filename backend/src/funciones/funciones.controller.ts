import { Controller, Get } from '@nestjs/common';
import { FuncionesService } from './funciones.service';

@Controller('funciones')
export class FuncionesController {
  constructor(private readonly funcionesService: FuncionesService) {}

  @Get()
  async findProgramadas() {
    const funciones = await this.funcionesService.findProgramadas();
    return { funciones };
  }
}
