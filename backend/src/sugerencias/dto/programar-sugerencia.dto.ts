import { IsDateString, IsInt, Max, Min } from 'class-validator';

export class ProgramarSugerenciaDto {
  @IsDateString({}, { message: 'fechaHora debe ser ISO DateTime' })
  fechaHora!: string;

  @IsInt()
  @Min(1)
  @Max(16)
  cupoTotal!: number;
}
