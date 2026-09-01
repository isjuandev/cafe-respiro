import { Module } from '@nestjs/common';
import { ConfiguracionPagoService } from './configuracion-pago.service';
import { ConfiguracionPagoController } from './configuracion-pago.controller';

@Module({
  controllers: [ConfiguracionPagoController],
  providers: [ConfiguracionPagoService],
  exports: [ConfiguracionPagoService],
})
export class ConfiguracionPagoModule {}
