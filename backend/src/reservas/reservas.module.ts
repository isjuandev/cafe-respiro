import { Module } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { ConfiguracionPagoModule } from '../configuracion-pago/configuracion-pago.module';

@Module({
  imports: [ConfiguracionPagoModule],
  controllers: [ReservasController],
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}
