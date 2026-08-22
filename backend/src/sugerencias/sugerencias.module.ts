import { Module } from '@nestjs/common';
import { SugerenciasService } from './sugerencias.service';
import { SugerenciasController } from './sugerencias.controller';

@Module({
  controllers: [SugerenciasController],
  providers: [SugerenciasService],
})
export class SugerenciasModule {}
