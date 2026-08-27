import { IsString, IsOptional, IsInt, IsUrl, MaxLength, MinLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePeliculaDto {
  @IsString()
  @MinLength(2, { message: 'Título mínimo 2 caracteres' })
  @MaxLength(120)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  director?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  anio?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  genero?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  duracionMin?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  sinopsis?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'posterUrl debe ser URL válida' })
  posterUrl?: string;
}
