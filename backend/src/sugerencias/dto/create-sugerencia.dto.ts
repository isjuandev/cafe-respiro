import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateSugerenciaDto {
  @IsString()
  @MinLength(2, { message: 'El título debe tener al menos 2 caracteres' })
  @MaxLength(120, { message: 'El título no puede exceder 120 caracteres' })
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'El comentario no puede exceder 500 caracteres' })
  comentario?: string;

  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(60, { message: 'El nombre no puede exceder 60 caracteres' })
  nombre!: string;

  @IsString()
  @MinLength(2, { message: 'El contacto es obligatorio' })
  @MaxLength(100, { message: 'El contacto no puede exceder 100 caracteres' })
  contacto!: string;
}
