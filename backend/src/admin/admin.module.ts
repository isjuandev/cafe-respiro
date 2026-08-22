import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminSugerenciasController } from './admin-sugerencias.controller';
import { AdminFuncionesController } from './admin-funciones.controller';

@Module({
  controllers: [AdminController, AdminSugerenciasController, AdminFuncionesController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
