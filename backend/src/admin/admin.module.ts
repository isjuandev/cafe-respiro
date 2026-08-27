import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminSugerenciasController } from './admin-sugerencias.controller';
import { AdminFuncionesController } from './admin-funciones.controller';
import { AdminVotacionesController } from './admin-votaciones.controller';
import { PeliculasModule } from '../peliculas/peliculas.module';
import { FuncionesModule } from '../funciones/funciones.module';
import { VotacionesModule } from '../votaciones/votaciones.module';
import { SugerenciasModule } from '../sugerencias/sugerencias.module';

@Module({
  imports: [PeliculasModule, FuncionesModule, VotacionesModule, SugerenciasModule],
  controllers: [AdminController, AdminSugerenciasController, AdminFuncionesController, AdminVotacionesController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
