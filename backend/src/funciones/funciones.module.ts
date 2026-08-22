import { Module } from '@nestjs/common';
import { FuncionesService } from './funciones.service';
import { FuncionesController } from './funciones.controller';

@Module({
  controllers: [FuncionesController],
  providers: [FuncionesService],
})
export class FuncionesModule {}
