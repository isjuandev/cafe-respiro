import { IsEnum } from 'class-validator';
import { SugerenciaEstado } from '@prisma/client';

export class UpdateEstadoDto {
  @IsEnum(SugerenciaEstado, { message: 'Estado debe ser PENDIENTE, GANADORA, PROGRAMADA o DESCARTADA' })
  estado!: SugerenciaEstado;
}
