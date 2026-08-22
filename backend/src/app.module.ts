import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { PeliculasModule } from './peliculas/peliculas.module';
import { SugerenciasModule } from './sugerencias/sugerencias.module';
import { VotosModule } from './votos/votos.module';
import { FuncionesModule } from './funciones/funciones.module';
import { ReservasModule } from './reservas/reservas.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    PrismaModule,
    PeliculasModule,
    SugerenciasModule,
    VotosModule,
    FuncionesModule,
    ReservasModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
