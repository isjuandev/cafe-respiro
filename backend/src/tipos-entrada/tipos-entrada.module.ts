import { Module } from '@nestjs/common';
import { TiposEntradaService } from './tipos-entrada.service';
import { TiposEntradaController } from './tipos-entrada.controller';

@Module({
  controllers: [TiposEntradaController],
  providers: [TiposEntradaService],
  exports: [TiposEntradaService],
})
export class TiposEntradaModule {}
