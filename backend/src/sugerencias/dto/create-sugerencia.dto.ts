import { IsString, IsOptional, MaxLength, MinLength, IsInt, IsUrl, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSugerenciaDto {
  @IsString()
  @MinLength(2, { message: 'El título debe tener al menos 2 caracteres' })
  @MaxLength(120, { message: 'El título no puede exceder 120 caracteres' })
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'El comentario no puede exceder 500 caracteres' })
  comentario?: string;

  // Campos opcionales para enriquecer la sugerencia con metadatos reales del backend
  // Si no se proporcionan, quedan null y el frontend usa fallback neutro
  @IsOptional()
  @IsString()
  @MaxLength(60)
  director?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  genero?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  anio?: number;

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

  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(60, { message: 'El nombre no puede exceder 60 caracteres' })
  nombre!: string;

  @IsString()
  @MinLength(2, { message: 'El contacto es obligatorio' })
  @MaxLength(100, { message: 'El contacto no puede exceder 100 caracteres' })
  contacto!: string;
}
