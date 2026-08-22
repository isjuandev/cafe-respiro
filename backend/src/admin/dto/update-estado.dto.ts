import { IsEnum } from 'class-validator';
import { SugerenciaEstado } from '@prisma/client';

export class UpdateEstadoDto {
  @IsEnum(SugerenciaEstado, { message: 'Estado debe ser PENDIENTE, PROGRAMADA o DESCARTADA' })
  estado!: SugerenciaEstado;
}
