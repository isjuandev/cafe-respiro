import { Module } from '@nestjs/common';
import { VotacionesService } from './votaciones.service';
import { VotacionesController } from './votaciones.controller';

@Module({
  controllers: [VotacionesController],
  providers: [VotacionesService],
  exports: [VotacionesService],
})
export class VotacionesModule {}
