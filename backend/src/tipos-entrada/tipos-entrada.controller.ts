import { Controller, Get } from '@nestjs/common';
import { TiposEntradaService } from './tipos-entrada.service';

@Controller('tipos-entrada')
export class TiposEntradaController {
  constructor(private readonly tiposEntradaService: TiposEntradaService) {}

  @Get()
  async getTiposEntrada() {
    const tipos = await this.tiposEntradaService.findActivos();
    return { tiposEntrada: tipos };
  }
}
