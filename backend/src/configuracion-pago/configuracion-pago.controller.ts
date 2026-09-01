import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ConfiguracionPagoService, UpdateConfiguracionPagoDto } from './configuracion-pago.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';

@Controller()
export class ConfiguracionPagoController {
  constructor(private readonly configService: ConfiguracionPagoService) {}

  @Get('configuracion-pago')
  async getConfiguracion() {
    return this.configService.getConfiguracion();
  }

  @UseGuards(AuthGuard)
  @RequireRole('admin')
  @Put('admin/configuracion-pago')
  async updateConfiguracion(@Body() dto: UpdateConfiguracionPagoDto) {
    return this.configService.updateConfiguracion(dto);
  }
}
