import { Module } from '@nestjs/common';
import { PeliculasService } from './peliculas.service';
import { PeliculasController } from './peliculas.controller';
import { FuncionesModule } from '../funciones/funciones.module';
import { SugerenciasModule } from '../sugerencias/sugerencias.module';

@Module({
  imports: [FuncionesModule, SugerenciasModule],
  controllers: [PeliculasController],
  providers: [PeliculasService],
  exports: [PeliculasService],
})
export class PeliculasModule {}
