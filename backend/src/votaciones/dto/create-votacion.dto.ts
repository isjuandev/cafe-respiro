import { ArrayMinSize, IsArray, IsDateString, IsString } from 'class-validator';

export class CreateVotacionDto {
  @IsDateString({}, { message: 'cierraAt debe ser ISO DateTime' })
  cierraAt!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Selecciona al menos una sugerencia' })
  @IsString({ each: true })
  sugerenciaIds!: string[];
}
