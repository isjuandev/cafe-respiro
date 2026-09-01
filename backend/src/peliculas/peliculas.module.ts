import { Module } from '@nestjs/common';
import { PeliculasService } from './peliculas.service';
import { PeliculasController } from './peliculas.controller';
import { TmdbService } from './tmdb.service';
import { FuncionesModule } from '../funciones/funciones.module';
import { SugerenciasModule } from '../sugerencias/sugerencias.module';

@Module({
  imports: [FuncionesModule, SugerenciasModule],
  controllers: [PeliculasController],
  providers: [PeliculasService, TmdbService],
  exports: [PeliculasService, TmdbService],
})
export class PeliculasModule {}
