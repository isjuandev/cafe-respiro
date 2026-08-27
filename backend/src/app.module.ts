import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { PeliculasModule } from './peliculas/peliculas.module';
import { SugerenciasModule } from './sugerencias/sugerencias.module';
import { VotosModule } from './votos/votos.module';
import { FuncionesModule } from './funciones/funciones.module';
import { ReservasModule } from './reservas/reservas.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MenuModule } from './menu/menu.module';
import { AuthModule } from './auth/auth.module';
import { VotacionesModule } from './votaciones/votaciones.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    MenuModule,
    AuthModule,
    VotacionesModule,
    PeliculasModule,
    SugerenciasModule,
    VotosModule,
    FuncionesModule,
    ReservasModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
