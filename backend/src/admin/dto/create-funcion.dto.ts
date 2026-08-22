import { IsString, IsInt, Min, Max, IsDateString } from 'class-validator';

export class CreateFuncionDto {
  @IsString()
  sugerenciaId!: string;

  @IsDateString({}, { message: 'fechaHora debe ser ISO DateTime' })
  fechaHora!: string;

  @IsInt()
  @Min(1)
  @Max(200)
  cupoTotal!: number;
}
